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
        # Mengambil semua tiket untuk training Unsupervised (K-Means)
        query = "SELECT title FROM tickets WHERE title IS NOT NULL"
        df_db = pd.read_sql(query, conn)
        conn.close()
        
        print(f"Found {len(df_db)} tickets from database.")
    except Exception as e:
        print(f"Database connection failed: {e}")
        df_db = pd.DataFrame(columns=['title'])
    
    print("Combining with data_tickets.csv...")
    try:
        if os.path.exists("data_tickets.csv"):
            df_csv = pd.read_csv("data_tickets.csv", encoding="latin1")
            # Gabungkan data awal dengan data dari database
            df_combined = pd.concat([df_csv, df_db], ignore_index=True)
        else:
            df_combined = df_db
            
        # Pastikan tidak ada nilai null
        df_combined['text'] = df_combined['title'].fillna('')
        
        texts = df_combined['text'].tolist()
        
        print(f"Retraining model with {len(texts)} total tickets...")
        model.train_new_model(texts)
        print("Retraining complete! Model updated.")
    except Exception as e:
        print(f"Error retraining model: {e}")

if __name__ == "__main__":
    retrain_from_db()
