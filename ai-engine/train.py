import pandas as pd
import model
import os

def train_from_csv(csv_path):
    print(f"Loading data from {csv_path}...")
    try:
        df = pd.read_csv(csv_path, encoding='latin1')
        # Menangani perbedaan nama kolom (Title vs title, Category vs category)
        title_col = 'Title' if 'Title' in df.columns else 'title'
        category_col = 'Category' if 'Category' in df.columns else 'category'
        
        # Karena tidak ada deskripsi di data_tickets.csv, gunakan saja Title
        df['text'] = df[title_col].fillna('')
        
        texts = df['text'].tolist()
        labels = df[category_col].tolist()
        
        print(f"Training model with {len(texts)} tickets...")
        model.train_new_model(texts, labels)
        print("Training complete! Model saved to ticket_classifier.pkl")
    except Exception as e:
        print(f"Error training model: {e}")

if __name__ == "__main__":
    train_from_csv("data_tickets.csv")
