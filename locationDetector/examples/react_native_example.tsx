/**
 * React Native example for integrating with the metadata extraction API.
 *
 * This example shows how to capture camera frames and send them to the
 * metadata extraction service from a mobile app.
 */

import React, { useState } from 'react';
import { View, Button, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as FileSystem from 'expo-file-system';

// TypeScript interface matching the API response
interface IndoorMetadata {
  scene_type: string;
  scene_confidence: number;
  text_detected: Array<{
    text: string;
    confidence: number;
  }>;
  landmarks: Array<{
    type: string;
    direction: string;
    distance: string;
    confidence: number;
    additional_info?: string;
  }>;
  lighting_quality: string;
  motion_blur_detected: boolean;
  frame_quality_score: number;
  processing_notes?: string;
}

const API_URL = 'http://your-server-ip:8000'; // Update with your server IP

export default function IndoorNavigationCamera() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<IndoorMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const captureFrame = async () => {
    if (!camera) return;

    setLoading(true);
    setError(null);
    setMetadata(null);

    try {
      // Capture photo
      const photo = await camera.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      setCapturedImage(photo.uri);

      // Send to API
      const metadata = await processFrame(photo.uri);
      setMetadata(metadata);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error capturing/processing frame:', err);
    } finally {
      setLoading(false);
    }
  };

  const processFrame = async (imageUri: string): Promise<IndoorMetadata> => {
    // Create form data
    const formData = new FormData();

    // Append image file
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    // Send request
    const response = await fetch(`${API_URL}/extract`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  };

  const renderMetadata = () => {
    if (!metadata) return null;

    return (
      <View style={styles.metadataContainer}>
        <Text style={styles.metadataTitle}>Detected Metadata</Text>

        <Text style={styles.metadataText}>
          Scene: {metadata.scene_type} ({(metadata.scene_confidence * 100).toFixed(0)}%)
        </Text>

        <Text style={styles.metadataText}>
          Frame Quality: {(metadata.frame_quality_score * 100).toFixed(0)}%
        </Text>

        <Text style={styles.metadataText}>
          Lighting: {metadata.lighting_quality}
        </Text>

        {metadata.motion_blur_detected && (
          <Text style={[styles.metadataText, styles.warning]}>
            ⚠️ Motion blur detected
          </Text>
        )}

        {metadata.text_detected.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Text Detected ({metadata.text_detected.length}):
            </Text>
            {metadata.text_detected.map((text, idx) => (
              <Text key={idx} style={styles.listItem}>
                • {text.text} ({(text.confidence * 100).toFixed(0)}%)
              </Text>
            ))}
          </View>
        )}

        {metadata.landmarks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Landmarks ({metadata.landmarks.length}):
            </Text>
            {metadata.landmarks.map((landmark, idx) => (
              <Text key={idx} style={styles.listItem}>
                • {landmark.type}: {landmark.direction}, {landmark.distance}
                {' '}({(landmark.confidence * 100).toFixed(0)}%)
              </Text>
            ))}
          </View>
        )}

        {metadata.processing_notes && (
          <Text style={[styles.metadataText, styles.notes]}>
            Note: {metadata.processing_notes}
          </Text>
        )}
      </View>
    );
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={CameraType.back}
        ref={(ref) => setCamera(ref)}
      >
        <View style={styles.overlay}>
          <Text style={styles.instructionText}>
            Point camera at indoor features
          </Text>
        </View>
      </Camera>

      <View style={styles.controls}>
        <Button
          title={loading ? 'Processing...' : 'Capture Frame'}
          onPress={captureFrame}
          disabled={loading}
        />
      </View>

      {loading && (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {capturedImage && (
        <Image source={{ uri: capturedImage }} style={styles.preview} />
      )}

      {renderMetadata()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  controls: {
    padding: 20,
    backgroundColor: '#fff',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  errorText: {
    color: '#c62828',
  },
  preview: {
    width: 100,
    height: 100,
    margin: 10,
    borderRadius: 5,
  },
  metadataContainer: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 5,
    maxHeight: 400,
  },
  metadataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  metadataText: {
    fontSize: 14,
    marginBottom: 5,
  },
  warning: {
    color: '#ff9800',
    fontWeight: 'bold',
  },
  notes: {
    color: '#666',
    fontStyle: 'italic',
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  listItem: {
    fontSize: 13,
    marginLeft: 10,
    marginBottom: 3,
  },
});
