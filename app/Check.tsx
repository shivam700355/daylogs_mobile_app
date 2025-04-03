import React from 'react';
import { View, Button, Text, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const SimpleDocumentPicker = () => {
  const [document, setDocument] = React.useState(null);
  const [base64, setBase64] = React.useState(null);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
    });

  

    if (result.canceled) {
    
    } else if (result.assets && result.assets.length > 0) {
      const pickedDocument = result.assets[0];
      setDocument(pickedDocument);


      // Convert the document to Base64
      try {
        const base64String = await FileSystem.readAsStringAsync(pickedDocument.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setBase64(base64String);
      
      } catch (error) {
      
      }
    } else {
    
    }
  };

  return (
    <View style={{ padding: 20, marginVertical: 300 }}>
      <Button title="Pick a Document" onPress={pickDocument} />
      {document && (
        <Text>
          Picked Document: {document.name} (Size: {document.size} bytes)
        </Text>
      )}
      {base64 && (
        <View style={{ marginTop: 20 }}>
          <Text>Base64 Encoded Document:</Text>
          <Text style={{ padding: 10, backgroundColor: '#f0f0f0' }}>
            {base64}
          </Text>
        </View>
      )}
    </View>
  );
};

export default SimpleDocumentPicker;
