import pandas as pd
import model
import os
import pymysql
from dotenv import load_dotenv

def retrain_from_db():
    print("Fetching new completed tickets from Laravel Database...")
    
    # Load env variables (akan membaca dari .env jika dijalankan lokal, 
    # atau menggunakan env dari docker-compose jika di docker)
    load_dotenv(dotenv_path="../.env")
    
    DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
    DB_USER = os.getenv("DB_USERNAME", "root")
    DB_PASS = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_DATABASE", "opstoday13")
    
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME)
        # Mengambil tiket yang sudah selesai dan memiliki kategori yang jelas
        query = "SELECT title, category, sub_category FROM tickets WHERE title IS NOT NULL AND category IS NOT NULL AND category != ''"
        df_db = pd.read_sql(query, conn)
        conn.close()
        
        print(f"Found {len(df_db)} labeled tickets from database.")
    except Exception as e:
        print(f"Database connection failed: {e}")
        df_db = pd.DataFrame(columns=['title', 'category', 'sub_category'])
    
    print("Combining with data_tickets.csv...")
    try:
        if os.path.exists("data_tickets.csv"):
            df_csv = pd.read_csv("data_tickets.csv", encoding="latin1")
            
            # Normalisasi nama kolom CSV agar sama dengan DB
            df_csv = df_csv.rename(columns={
                'Title': 'title',
                'Category': 'category',
                'Sub Category': 'sub_category'
            })
            
            # Ambil hanya kolom yang dibutuhkan
            if set(['title', 'category', 'sub_category']).issubset(df_csv.columns):
                df_csv = df_csv[['title', 'category', 'sub_category']]
                # Hilangkan row yang tidak punya judul atau kategori
                df_csv = df_csv.dropna(subset=['title', 'category'])
            else:
                df_csv = pd.DataFrame(columns=['title', 'category', 'sub_category'])

            # Gabungkan data awal dengan data dari database
            df_combined = pd.concat([df_csv, df_db], ignore_index=True)
        else:
            df_combined = df_db
            
        # Bersihkan data NA
        df_combined = df_combined.dropna(subset=['title', 'category'])
        df_combined['sub_category'] = df_combined['sub_category'].fillna('Unknown')
        
        # Ekstrak menjadi list
        titles = df_combined['title'].tolist()
        categories = df_combined['category'].tolist()
        sub_categories = df_combined['sub_category'].tolist()
        
        print(f"Retraining model with {len(titles)} labeled historical tickets...")
        model.train_new_model(titles, categories, sub_categories)
        print("Retraining complete! Supervised ML Model updated.")
    except Exception as e:
        print(f"Error retraining model: {e}")

if __name__ == "__main__":
    retrain_from_db()
