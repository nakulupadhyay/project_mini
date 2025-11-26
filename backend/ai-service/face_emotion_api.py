from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import base64
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

# Paths to model files
MODEL_PATH = '../ai-models/model_file_30epochs.h5'
CASCADE_PATH = '../ai-models/haarcascade_frontalface_default.xml'

# Check if files exist
if not os.path.exists(MODEL_PATH):
    print(f"❌ Error: Model file not found at {MODEL_PATH}")
    print("Please place 'model_file_30epochs.h5' in backend/ai-models/")
    exit(1)

if not os.path.exists(CASCADE_PATH):
    print(f"❌ Error: Cascade file not found at {CASCADE_PATH}")
    print("Please place 'haarcascade_frontalface_default.xml' in backend/ai-models/")
    exit(1)

# Load model and cascade
print("🔄 Loading facial emotion detection model...")
model = load_model(MODEL_PATH)
faceDetect = cv2.CascadeClassifier(CASCADE_PATH)
print("✅ Model loaded successfully!")

# Emotion labels (matching your model's training)
labels_dict = {
    0: 'Angry',
    1: 'Disgust',
    2: 'Fear',
    3: 'Happy',
    4: 'Neutral',
    5: 'Sad',
    6: 'Surprise'
}

# Map to your app's emotion types
emotion_map = {
    'Angry': 'Angry',
    'Disgust': 'Stressed',
    'Fear': 'Anxious',
    'Happy': 'Happy',
    'Neutral': 'Neutral',
    'Sad': 'Sad',
    'Surprise': 'Excited'
}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': 'Custom CNN Face Emotion Detector',
        'emotions': list(labels_dict.values())
    })

@app.route('/detect-face', methods=['POST'])
def detect_face_emotion():
    try:
        # Get image from request
        data = request.json
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400

        # Decode base64 image
        image_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
        image_bytes = base64.b64decode(image_data)
        
        # Convert to OpenCV format
        image = Image.open(io.BytesIO(image_bytes))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = faceDetect.detectMultiScale(gray, 1.3, 3)
        
        if len(faces) == 0:
            return jsonify({
                'error': 'No face detected',
                'message': 'Please ensure your face is clearly visible in the frame'
            }), 400
        
        # Process first face
        x, y, w, h = faces[0]
        sub_face_img = gray[y:y+h, x:x+w]
        resized = cv2.resize(sub_face_img, (48, 48))
        normalize = resized / 255.0
        reshaped = np.reshape(normalize, (1, 48, 48, 1))
        
        # Predict emotion
        result = model.predict(reshaped, verbose=0)
        label = np.argmax(result, axis=1)[0]
        raw_emotion = labels_dict[label]
        mapped_emotion = emotion_map[raw_emotion]
        
        # Get confidence scores for all emotions
        confidences = result[0]
        all_emotions = {
            emotion_map[labels_dict[i]]: float(confidences[i] * 100)
            for i in range(len(labels_dict))
        }
        
        # Main emotion confidence
        confidence = float(confidences[label] * 100)
        
        print(f"✅ Detected: {mapped_emotion} ({confidence:.2f}%)")
        
        return jsonify({
            'success': True,
            'emotion': mapped_emotion,
            'raw_emotion': raw_emotion,
            'confidence': confidence,
            'all_emotions': all_emotions,
            'face_coordinates': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
            'model_type': 'Custom CNN (30 epochs)'
        })
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/detect-face-batch', methods=['POST'])
def detect_face_batch():
    """Process multiple faces in one image"""
    try:
        data = request.json
        image_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
        image_bytes = base64.b64decode(image_data)
        
        image = Image.open(io.BytesIO(image_bytes))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        faces = faceDetect.detectMultiScale(gray, 1.3, 3)
        
        if len(faces) == 0:
            return jsonify({'error': 'No faces detected'}), 400
        
        results = []
        for (x, y, w, h) in faces:
            sub_face_img = gray[y:y+h, x:x+w]
            resized = cv2.resize(sub_face_img, (48, 48))
            normalize = resized / 255.0
            reshaped = np.reshape(normalize, (1, 48, 48, 1))
            
            result = model.predict(reshaped, verbose=0)
            label = np.argmax(result, axis=1)[0]
            raw_emotion = labels_dict[label]
            mapped_emotion = emotion_map[raw_emotion]
            confidence = float(result[0][label] * 100)
            
            results.append({
                'emotion': mapped_emotion,
                'raw_emotion': raw_emotion,
                'confidence': confidence,
                'coordinates': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)}
            })
        
        return jsonify({
            'success': True,
            'faces_count': len(faces),
            'faces': results
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Custom Face Emotion Detection API")
    print("="*60)
    print(f"📍 Running on: http://localhost:5001")
    print(f"🤖 Model: Custom CNN (30 epochs)")
    print(f"📊 Emotions: {', '.join(labels_dict.values())}")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)