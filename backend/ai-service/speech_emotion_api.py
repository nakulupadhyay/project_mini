from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import librosa
import joblib
from tensorflow.keras.models import load_model
import soundfile as sf
import io
import base64
import os

app = Flask(__name__)
CORS(app)

# Paths
MODEL_PATH = '../ai-models/ser_model.h5'
ENCODER_PATH = '../ai-models/label_encoder.pkl'

# Constants
SAMPLE_RATE = 22050
N_MFCC = 40
MAX_PAD_LEN = 174

# Check files
if not os.path.exists(MODEL_PATH):
    print(f"❌ Error: Speech model not found at {MODEL_PATH}")
    exit(1)

if not os.path.exists(ENCODER_PATH):
    print(f"❌ Error: Label encoder not found at {ENCODER_PATH}")
    exit(1)

# Load model and encoder
print("🔄 Loading speech emotion recognition model...")
model = load_model(MODEL_PATH)
label_encoder = joblib.load(ENCODER_PATH)
print("✅ Speech model loaded successfully!")

# Emotion mapping
emotion_map = {
    'angry': 'Angry',
    'disgust': 'Stressed',
    'fear': 'Anxious',
    'happy': 'Happy',
    'neutral': 'Neutral',
    'sad': 'Sad',
    'surprise': 'Excited',
    'calm': 'Calm'
}

def extract_features(audio_data, n_mfcc=N_MFCC, max_pad_len=MAX_PAD_LEN):
    """Extract MFCC features from audio"""
    try:
        mfccs = librosa.feature.mfcc(y=audio_data, sr=SAMPLE_RATE, n_mfcc=n_mfcc)
        
        # Pad or truncate
        if mfccs.shape[1] > max_pad_len:
            mfccs = mfccs[:, :max_pad_len]
        else:
            pad_width = max_pad_len - mfccs.shape[1]
            mfccs = np.pad(mfccs, ((0, 0), (0, pad_width)), mode='constant')
        
        return mfccs
    except Exception as e:
        print(f"Error extracting features: {e}")
        return None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': 'Speech Emotion Recognition',
        'sample_rate': SAMPLE_RATE
    })

@app.route('/detect-speech', methods=['POST'])
def detect_speech_emotion():
    try:
        # Get audio data
        if 'audio' not in request.files and 'audio_base64' not in request.json:
            return jsonify({'error': 'No audio provided'}), 400
        
        # Handle file upload
        if 'audio' in request.files:
            audio_file = request.files['audio']
            audio_data, sr = librosa.load(audio_file, sr=SAMPLE_RATE)
        
        # Handle base64 audio
        else:
            audio_base64 = request.json['audio_base64']
            audio_bytes = base64.b64decode(audio_base64)
            audio_data, sr = sf.read(io.BytesIO(audio_bytes))
            
            # Resample if needed
            if sr != SAMPLE_RATE:
                audio_data = librosa.resample(audio_data, orig_sr=sr, target_sr=SAMPLE_RATE)
        
        # Extract features
        features = extract_features(audio_data)
        if features is None:
            return jsonify({'error': 'Failed to extract features'}), 500
        
        # Reshape for model
        features_transposed = features.T
        features_reshaped = np.expand_dims(features_transposed, axis=0)
        
        # Predict
        prediction_probs = model.predict(features_reshaped, verbose=0)
        prediction_class = np.argmax(prediction_probs)
        raw_emotion = label_encoder.inverse_transform([prediction_class])[0]
        
        # Map emotion
        mapped_emotion = emotion_map.get(raw_emotion.lower(), 'Neutral')
        confidence = float(np.max(prediction_probs) * 100)
        
        # Get all probabilities
        all_emotions = {}
        for i, emotion_label in enumerate(label_encoder.classes_):
            mapped = emotion_map.get(emotion_label.lower(), emotion_label.capitalize())
            all_emotions[mapped] = float(prediction_probs[0][i] * 100)
        
        print(f"✅ Speech Detected: {mapped_emotion} ({confidence:.2f}%)")
        
        return jsonify({
            'success': True,
            'emotion': mapped_emotion,
            'raw_emotion': raw_emotion,
            'confidence': confidence,
            'all_emotions': all_emotions,
            'model_type': 'LSTM Speech Emotion Recognition'
        })
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Speech Emotion Recognition API")
    print("="*60)
    print(f"📍 Running on: http://localhost:5002")
    print(f"🎤 Model: LSTM with MFCC features")
    print(f"📊 Sample Rate: {SAMPLE_RATE} Hz")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5002, debug=True)