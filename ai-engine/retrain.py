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
        # Mengambil tiket yang sudah selesai (Closed) dan memiliki kategori bawaan
        query = "SELECT title, category FROM tickets WHERE status = 'Closed' AND category IS NOT NULL"
        df_db = pd.read_sql(query, conn)
        conn.close()
        
        print(f"Found {len(df_db)} tickets from database.")
    except Exception as e:
        print(f"Database connection failed: {e}")
        df_db = pd.DataFrame(columns=['title', 'category'])
    
    print("Combining with initial_data.csv...")
    try:
        df_csv = pd.read_csv("initial_data.csv")
        
        # Gabungkan data awal dengan data dari database
        df_combined = pd.concat([df_csv, df_db], ignore_index=True)
        
        # Pastikan tidak ada nilai null
        df_combined['text'] = df_combined['title'].fillna('')
        
        texts = df_combined['text'].tolist()
        labels = df_combined['category'].tolist()
        
        print(f"Retraining model with {len(texts)} total tickets...")
        model.train_new_model(texts, labels)
        print("Retraining complete! Model updated.")
    except Exception as e:
        print(f"Error retraining model: {e}")

if __name__ == "__main__":
    retrain_from_db()
