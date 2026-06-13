import pickle
import os
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

MODEL_PATH = "ticket_classifier.pkl"

# Indonesian Stopwords (simple version)
stop_words_id = [
    'di', 'ke', 'dari', 'dan', 'atau', 'untuk', 'yang', 'dengan', 'ini', 'itu', 'pada', 'jika',
    'karena', 'bisa', 'ada', 'tidak', 'belum', 'sudah', 'akan', 'tolong', 'bantu', 'bantuan',
    'mohon', 'tanya', 'masalah', 'kendala', 'eror', 'gagal', 'cek', 'perlu', 'minta', 'buat', 'terus',
    'mau', 'muncul', 'kenapa', 'gimana', 'cara', 'apa', 'lagi', 'masih', 'udah', 'gak', 'ga', 'nggak',
    'pas', 'saat', 'waktu', 'ketika', 'setelah', 'bikin', 'kasih', 'buka', 'tutup', 'nya', 'kok', 'sih',
    'rusak', 'mati', 'lambat', 'lemot', 'lelet', 'cepat', 'baru', 'lama', 'tdk', 'blm', 'sdh', 'dgn',
    'ganti', 'tambah', 'hapus', 'kurang', 'baik', 'benar', 'salah', 'ingin', 'harus', 'coba', 'lupa', 'akses', 'login', 'notif',
    'masukan', 'kode', 'nomor'
]

def get_model():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    return None

def train_new_model(texts, labels):
    pipeline = Pipeline([
        ('vectorizer', CountVectorizer(stop_words=stop_words_id, lowercase=True)),
        ('classifier', MultinomialNB())
    ])
    pipeline.fit(texts, labels)
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipeline, f)
    return pipeline

def update_model(new_texts, new_labels):
    model = get_model()
    if not model:
        # If no model exists, train a new one
        return train_new_model(new_texts, new_labels)
    
    # MultinomialNB supports partial_fit for incremental learning
    # However, Pipeline doesn't support partial_fit directly if vectorizer needs to learn new vocabulary.
    # For a simple approach, we'll retrain the whole model with combined old and new data, 
    # but in a real-world scenario we'd query the DB for all past tickets to retrain.
    # For now, we simulate retraining.
    pass

def extract_keyword(text):
    import re
    # Ambil huruf saja, minimal 3 karakter
    words = re.findall(r'\b[a-z]{3,}\b', text.lower())
    
    # Gunakan stop words khusus untuk keyword agar kata penting (rusak, error, dll) tidak terbuang
    keyword_stopwords = {
        'di', 'ke', 'dari', 'dan', 'atau', 'untuk', 'yang', 'dengan', 'ini', 'itu', 'pada', 'jika',
        'karena', 'bisa', 'ada', 'tidak', 'belum', 'sudah', 'akan', 'tolong', 'bantu', 'bantuan',
        'mohon', 'tanya', 'cek', 'perlu', 'minta', 'buat', 'terus', 'mau', 'muncul', 'kenapa', 
        'gimana', 'cara', 'apa', 'lagi', 'masih', 'udah', 'gak', 'ga', 'nggak', 'pas', 'saat', 
        'waktu', 'ketika', 'setelah', 'bikin', 'kasih', 'nya', 'kok', 'sih', 'tdk', 'blm', 'sdh', 'dgn',
        'ingin', 'harus', 'coba', 'tentang', 'terkait', 'tolong', 'sekali', 'sangat'
    }
    
    valid_words = [w for w in words if w not in keyword_stopwords]
    
    # Ambil maksimal 3 kata pertama agar case lebih spesifik (misal: "printer rusak", "gagal login hris")
    if len(valid_words) >= 3:
        return " ".join(valid_words[:3])
    elif len(valid_words) > 0:
        return " ".join(valid_words)
    return None

def predict_category(text):
    model = get_model()
    keyword = extract_keyword(text)

    if not model:
        return {"category": "Uncategorized", "keyword": keyword, "confidence": 0.0}
    
    prediction = model.predict([text])[0]
    probabilities = model.predict_proba([text])[0]
    confidence = max(probabilities)
    
    return {"category": prediction, "keyword": keyword, "confidence": float(confidence)}
