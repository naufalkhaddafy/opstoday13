import pickle
import os
import re
from sklearn.feature_extraction.text import TfidfVectorizer

MODEL_PATH = "ticket_classifier.pkl"

# Indonesian Stopwords (extended version for tickets)
stop_words_id = [
    'di', 'ke', 'dari', 'dan', 'atau', 'untuk', 'yang', 'dengan', 'ini', 'itu', 'pada', 'jika',
    'karena', 'bisa', 'ada', 'tidak', 'belum', 'sudah', 'akan', 'tolong', 'bantu', 'bantuan',
    'mohon', 'tanya', 'masalah', 'kendala', 'eror', 'error', 'gagal', 'cek', 'perlu', 'minta', 'buat', 'terus',
    'mau', 'muncul', 'kenapa', 'gimana', 'cara', 'apa', 'lagi', 'masih', 'udah', 'gak', 'ga', 'nggak',
    'pas', 'saat', 'waktu', 'ketika', 'setelah', 'bikin', 'kasih', 'buka', 'tutup', 'nya', 'kok', 'sih',
    'baru', 'lama', 'tdk', 'blm', 'sdh', 'dgn', 'all', 'tiket', 'ticket', 'unit', 'selesai', 'service', 'kpca', 'ab01'
]

def get_model_data():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    return None

def clean_text(text):
    # Basic Case Folding and noise removal
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return text

def train_new_model(texts):
    # Ensure there is text
    if not texts:
        texts = ["dummy text"]

    cleaned_texts = [clean_text(t) for t in texts]

    # Use TfidfVectorizer to learn vocabulary and global word importance (IDF)
    vectorizer = TfidfVectorizer(stop_words=stop_words_id, lowercase=True)
    vectorizer.fit(cleaned_texts)
    
    model_data = {
        'vectorizer': vectorizer
    }
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model_data, f)
        
    return model_data

# IT Category Mapping untuk menghasilkan kelompok tren yang besar dan akurat
CATEGORY_MAP = {
    'email': 'Email & Akun', 'outlook': 'Email & Akun', 'login': 'Email & Akun', 
    'akun': 'Email & Akun', 'password': 'Email & Akun', 'lock': 'Email & Akun',
    
    'printer': 'Printer & Scanner', 'scanner': 'Printer & Scanner', 'tinta': 'Printer & Scanner',
    
    'zoom': 'Aplikasi Meeting', 'teams': 'Aplikasi Meeting', 'skype': 'Aplikasi Meeting',
    
    'network': 'Jaringan & Internet', 'wifi': 'Jaringan & Internet', 'internet': 'Jaringan & Internet', 
    'kabel': 'Jaringan & Internet', 'lan': 'Jaringan & Internet',
    
    'komputer': 'Hardware PC/Laptop', 'laptop': 'Hardware PC/Laptop', 'pc': 'Hardware PC/Laptop', 
    'keyboard': 'Hardware PC/Laptop', 'mouse': 'Hardware PC/Laptop', 'monitor': 'Hardware PC/Laptop',
    
    'drive': 'Storage & Data', 'penuh': 'Storage & Data', 'folder': 'Storage & Data', 
    'file': 'Storage & Data', 'onedrive': 'Storage & Data',
    
    'sap': 'Aplikasi Sistem', 'ellipse': 'Aplikasi Sistem', 'fingerprint': 'Sistem Absensi',
    'cctv': 'Sistem CCTV', 'gps': 'Sistem GPS'
}

def predict_category(text):
    model_data = get_model_data()
    if not model_data:
        return {"cluster_id": 0, "cluster_label": "Uncategorized"}
    
    vectorizer = model_data['vectorizer']
    cleaned_text = clean_text(text)
    
    if not cleaned_text.strip():
        return {"cluster_id": 0, "cluster_label": "Isu: Lain-lain"}
        
    # 1. Cek Mapping Kategori Besar Terlebih Dahulu
    words = cleaned_text.split()
    matched_category = None
    for word in words:
        if word in CATEGORY_MAP:
            matched_category = "Isu: " + CATEGORY_MAP[word]
            break
            
    # 2. Jika tidak ada di Mapping, gunakan 1 Kata Kunci Utama dari TF-IDF
    if matched_category:
        label = matched_category
    else:
        tfidf_matrix = vectorizer.transform([cleaned_text])
        feature_names = vectorizer.get_feature_names_out()
        scores = tfidf_matrix.toarray()[0]
        
        # Ambil 1 kata teratas saja agar tiket dengan kata yang sama bisa berkumpul di 1 ember besar
        top_indices = scores.argsort()[::-1][:1]
        top_terms = [feature_names[i] for i in top_indices if scores[i] > 0]
        
        if len(top_terms) > 0:
            label = "Isu: " + top_terms[0].capitalize()
        else:
            label = "Isu: Lain-lain"
        
    cluster_id = abs(hash(label)) % 100000
    return {"cluster_id": cluster_id, "cluster_label": label}
