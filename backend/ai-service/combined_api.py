from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import librosa
import joblib
from tensorflow.keras.models import load_model
import base64
from PIL import Image
import io
import soundfile as sf
import os

app = Flask(__name__)
CORS(app)

# Load Face Model
print("🔄 Loading face emotion model...")
face_model = load_model(r'D:/projec_mini/emotion-health-monitor/backend/ai-models/model_file_30epochs.h5')
face_cascade = cv2.CascadeClassifier(r'D:/projec_mini/emotion-health-monitor/backend/ai-models/haarcascade_frontalface_default.xml')

# Load Speech Model
print("🔄 Loading speech emotion model...")
speech_model = load_model(r'D:/projec_mini/emotion-health-monitor/backend/ai-models/ser_model.h5')
label_encoder = joblib.load(r'D:/projec_mini/emotion-health-monitor/backend/ai-models/label_encoder.pkl')

print("✅ All models loaded successfully!")

# Face emotion labels
face_labels = {0: 'Angry', 1: 'Disgust', 2: 'Fear', 3: 'Happy', 4: 'Neutral', 5: 'Sad', 6: 'Surprise'}

# Emotion mapping
emotion_map = {
    'Angry': 'Angry', 'Disgust': 'Stressed', 'Fear': 'Anxious',
    'Happy': 'Happy', 'Neutral': 'Neutral', 'Sad': 'Sad', 'Surprise': 'Excited'
}

# Speech constants
SAMPLE_RATE = 22050
N_MFCC = 40
MAX_PAD_LEN = 174

def extract_mfcc(audio_data):
    """Extract MFCC features"""
    mfccs = librosa.feature.mfcc(y=audio_data, sr=SAMPLE_RATE, n_mfcc=N_MFCC)
    if mfccs.shape[1] > MAX_PAD_LEN:
        mfccs = mfccs[:, :MAX_PAD_LEN]
    else:
        pad_width = MAX_PAD_LEN - mfccs.shape[1]
        mfccs = np.pad(mfccs, ((0, 0), (0, pad_width)), mode='constant')
    return mfccs

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'models': ['face_emotion', 'speech_emotion'],
        'version': '1.0'
    })

@app.route('/detect-multimodal', methods=['POST'])
def detect_multimodal():
    """Detect emotion from both face and voice"""
    try:
        data = request.json
        results = {}
        
        # Process face if image provided
        if 'image' in data and data['image']:
            image_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            faces = face_cascade.detectMultiScale(gray, 1.3, 3)
            
            if len(faces) > 0:
                x, y, w, h = faces[0]
                sub_face = gray[y:y+h, x:x+w]
                resized = cv2.resize(sub_face, (48, 48))
                normalized = resized / 255.0
                reshaped = np.reshape(normalized, (1, 48, 48, 1))
                
                face_pred = face_model.predict(reshaped, verbose=0)
                face_label = np.argmax(face_pred, axis=1)[0]
                raw_emotion = face_labels[face_label]
                mapped = emotion_map[raw_emotion]
                confidence = float(face_pred[0][face_label] * 100)
                
                results['face'] = {
                    'emotion': mapped,
                    'raw_emotion': raw_emotion,
                    'confidence': confidence
                }
        
        # Process audio if provided
        if 'audio_base64' in data and data['audio_base64']:
            audio_bytes = base64.b64decode(data['audio_base64'])
            audio_data, sr = sf.read(io.BytesIO(audio_bytes))
            
            if sr != SAMPLE_RATE:
                audio_data = librosa.resample(audio_data, orig_sr=sr, target_sr=SAMPLE_RATE)
            
            features = extract_mfcc(audio_data)
            features_transposed = features.T
            features_reshaped = np.expand_dims(features_transposed, axis=0)
            
            speech_pred = speech_model.predict(features_reshaped, verbose=0)
            speech_class = np.argmax(speech_pred)
            raw_emotion = label_encoder.inverse_transform([speech_class])[0]
            mapped = emotion_map.get(raw_emotion.capitalize(), 'Neutral')
            confidence = float(np.max(speech_pred) * 100)
            
            results['speech'] = {
                'emotion': mapped,
                'raw_emotion': raw_emotion,
                'confidence': confidence
            }
        
        # Combine results if both available
        if 'face' in results and 'speech' in results:
            # Weighted average (60% face, 40% voice)
            face_conf = results['face']['confidence']
            speech_conf = results['speech']['confidence']
            
            # Use the one with higher confidence or combine
            if face_conf > speech_conf:
                final_emotion = results['face']['emotion']
                final_confidence = (face_conf * 0.6 + speech_conf * 0.4)
            else:
                final_emotion = results['speech']['emotion']
                final_confidence = (face_conf * 0.4 + speech_conf * 0.6)
            
            results['combined'] = {
                'emotion': final_emotion,
                'confidence': final_confidence,
                'method': 'weighted_average'
            }
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/detect-face', methods=['POST'])
def detect_face():
    """Face emotion only"""
    try:
        data = request.json
        image_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
        image_bytes = base64.b64decode(image_data)
        
        image = Image.open(io.BytesIO(image_bytes))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 3)
        
        if len(faces) == 0:
            return jsonify({'error': 'No face detected'}), 400
        
        x, y, w, h = faces[0]
        sub_face = gray[y:y+h, x:x+w]
        resized = cv2.resize(sub_face, (48, 48))
        normalized = resized / 255.0
        reshaped = np.reshape(normalized, (1, 48, 48, 1))
        
        result = face_model.predict(reshaped, verbose=0)
        label = np.argmax(result, axis=1)[0]
        raw_emotion = face_labels[label]
        mapped_emotion = emotion_map[raw_emotion]
        confidence = float(result[0][label] * 100)
        
        all_emotions = {
            emotion_map[face_labels[i]]: float(result[0][i] * 100)
            for i in range(len(face_labels))
        }
        
        return jsonify({
            'success': True,
            'emotion': mapped_emotion,
            'raw_emotion': raw_emotion,
            'confidence': confidence,
            'all_emotions': all_emotions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Combined Emotion Detection API")
    print("="*60)
    print(f"📍 Running on: http://localhost:5001")
    print(f"🎭 Face Emotion Detection: ✅")
    print(f"🎤 Speech Emotion Detection: ✅")
    print(f"🔀 Multimodal Fusion: ✅")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)