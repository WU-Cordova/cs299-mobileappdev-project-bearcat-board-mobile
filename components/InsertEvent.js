import { useState } from "react";
import { Button, Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { Calendar } from 'react-native-calendars';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

import { supabaseClient } from '../supabaseClient.js'

import { useRefetchContext } from '../contexts/RefetchContext'


export default function InsertEvent() {
    const { userId, getToken } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [input1, setInput1] = useState('');
    const [input2, setInput2] = useState('');
    const [selected, setSelected] = useState('');
    const [error, setError] = useState(null);
    const [image, setImage] = useState(null);
    const { triggerRefetch } = useRefetchContext();
    const TITLE_MAX_LENGTH = 35; // adjust if needed seems kind of small
    const CONTENT_MAX_LENGTH = 50; // adjust if needed

    const onClose = () => {
        setInput1('');
        setInput2('');
        setImage(null);
        setIsOpen(false);
    };

    const isInputsValid = () => {
        return input1.trim() !== "" && selected !== "";
    };

const handleAddEvent = () => {
    if (!isInputsValid()) {
        Alert.alert(
            'Missing Information',
            'Please add a title and select a date before adding an event.',
            [{ text: 'OK' }]
        );
    } else {
        try {
            insertEvent();
        } catch (error) {
            setError(error.message);
        }
    }
};

    const insertEvent = async () => {
        try {
            const supabaseAccessToken = await getToken({ template: "supabase" })
            const supabase = await supabaseClient(supabaseAccessToken)
            const { error } = await supabase
                .from('poster')
                .insert({
                    title: input1,
                    date: selected,
                    content: input2,
                    user_id: userId,
                    image: image, //replace with s3 container if time
                });

            if (error) {
                throw new Error(`Supabase error: ${error.message}`);
            }
            triggerRefetch();
            onClose();
        } catch (error) {
            throw new Error(`Error inserting data: ${error.message}`);
        }
    };
    const handleImagePicker = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync(); // Request permission to access media
            if (status !== 'granted') {
                setError('Permission to access media library is required');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                base64: true,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled) {
                setImage(`data:${result.assets[0].mimeType};base64,${result.assets[0].base64}`); 
            }
        } catch (e) {
            setError(`Error picking image: ${e.message}`);
        }
    };
    const handleTitleChange = (text) => {
        if (text.length <= TITLE_MAX_LENGTH) {
          setInput1(text);
        }
      };
    
      const handleContentChange = (text) => {
        if (text.length <= CONTENT_MAX_LENGTH) {
          setInput2(text);
        }
      };

    return (
        <View>

            <TouchableOpacity onPress={() => setIsOpen(true)}>
                <Ionicons name="add-circle" color={'red'} size={50} />
            </TouchableOpacity>
            <Modal visible={isOpen} onRequestClose={onClose}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close-outline" size={40} color="red" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Add an Event</Text>
                    <Calendar style={{
                        borderWidth: 1,
                        borderColor: 'gray',
                    }}
                        onDayPress={day => {
                            setSelected(day.dateString);
                        }}
                        markedDates={{
                            [selected]: { selected: true, disableTouchEvent: true, selectedDotColor: 'orange' }
                        }}
                    />

                    <TextInput
                        placeholder="Event Title"
                        value={input1}
                        onChangeText={handleTitleChange}
                        style={styles.event_title}
                    />

                    <TextInput style={styles.event_content}
                        placeholder="Event Content (Optional)"
                        value={input2}
                        onChangeText={handleContentChange}
                    />
                    <TouchableOpacity
                            style={styles.imagePickerButton}
                            onPress={handleImagePicker}
                        >
                            <Text style={{ color: 'white' }}>Upload Image</Text>
                        </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleAddEvent}
                        style={{
                            backgroundColor: isInputsValid() ? 'green' : 'gray', paddingVertical: 15,
                            paddingHorizontal: 20,
                            borderRadius: 10,
                        }}
                    >
                        <Text style={{ color: 'white' }}>Add Event</Text>
                    </TouchableOpacity>
                    {error && <Text style={{ color: 'red' }}>{error}</Text>}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24

    },
    closeButton: {
        position: "absolute",
        top: 20,
        left: 20,
    },
    event_title: {
        fontSize: 20,
        padding: 10,
        margin: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 10,
        backgroundColor: 'white',
        color: 'black',
        textAlign: 'center'
    },
    event_content: {
        fontSize: 20,
        padding: 10,
        margin: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 10,
        backgroundColor: 'white',
        color: 'black',
        textAlign: 'center'
    },
    imagePickerButton: {
        backgroundColor: 'blue',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginVertical: 10,
    },

});