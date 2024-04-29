// I am sorry for those who read this code
import { StyleSheet, Text, View, Image, TouchableOpacity, Button, Alert, TextInput, ScrollView, Dimensions } from 'react-native';
import img from '../assets/OIG2.png'
import Modal from "react-native-modal";
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Calendar } from 'react-native-calendars';
const screenWidth = Dimensions.get('window').width;

import { supabaseClient } from '../supabaseClient';
import { getPosters, getLikes } from '../supabaseData';

import { useRefetchContext } from '../contexts/RefetchContext';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Board() {
    const { refetchCounter, triggerRefetch } = useRefetchContext()
    const { userId, getToken } = useAuth();
    const [posters, setPosters] = useState([]);
    const [canDeleteEdit, setCanDeleteEdit] = useState(false);
    const [selectedPoster, setSelectedPoster] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [input1, setInput1] = useState('');
    const [input2, setInput2] = useState('');
    const [selected, setSelected] = useState('');
    const [error, setError] = useState(null);
    const TITLE_MAX_LENGTH = 35; // adjust if needed 
    const CONTENT_MAX_LENGTH = 50; // adjust if needed


    const fetchData = async () => {
        try {
            const supabaseAccessToken = await getToken({ template: "supabase" })
            const supabase = await supabaseClient(supabaseAccessToken)
            const postersData = await getPosters(supabase);
            const posterIds = postersData.map(poster => poster.poster_id);
            const likesData = await getLikes(posterIds, supabase);

            const postersWithLikes = postersData.map(poster => {
                const likesCount = likesData.filter(like => like.poster_id === poster.poster_id).length;
                const userGoing = likesData.some(like => like.poster_id === poster.poster_id && like.user_id === userId);
                return {
                    ...poster,
                    likes: likesCount,
                    isGoing: userGoing
                };
            });

            setPosters(postersWithLikes);
        } catch (error) {
            console.error('Error in Fetch Data Function:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [refetchCounter]);

    const toggleGoing = async (posterId) => {
        try {
            if (!posters) return;
            const isUserGoing = posters.find(poster => poster.poster_id === posterId)?.isGoing;
            if (isUserGoing === undefined) return;

            if (!isUserGoing) {
                const supabaseAccessToken = await getToken({ template: "supabase" })
                const supabase = await supabaseClient(supabaseAccessToken);
                await supabase
                    .from('likes')
                    .insert([{ poster_id: posterId, user_id: userId }]);
            } else {
                const supabaseAccessToken = await getToken({ template: "supabase" })
                const supabase = await supabaseClient(supabaseAccessToken);
                await supabase
                    .from('likes')
                    .delete()
                    .eq('poster_id', posterId)
                    .eq('user_id', userId);
            }

            setPosters(prevPosters => {
                if (!prevPosters) return null;

                return prevPosters.map(poster => {
                    if (poster.poster_id === posterId) {
                        return {
                            ...poster,
                            likes: isUserGoing ? poster.likes - 1 : poster.likes + 1,
                            isGoing: !isUserGoing
                        };
                    }
                    return poster;
                });
            });

        } catch (error) {
            console.error(error);
        }
    };

    const onClose = () => {
        setIsOpen(false);
        if (canDeleteEdit) {
            setCanDeleteEdit(false);
        }
    };

    const handleDeleteConfirmation = async () => {
        if (!selectedPoster || !selectedPoster.user_id || selectedPoster.user_id !== userId) {
            setError("Unauthorized action");
            return;
        }
        try {
            const posterId = selectedPoster.poster_id;
            const supabaseAccessToken = await getToken({ template: "supabase" })
            const supabase = await supabaseClient(supabaseAccessToken);
            const { error } = await supabase
                .from('poster')
                .delete()
                .eq('poster_id', posterId)
                .eq("user_id", userId);

            if (error) {
                console.error('Error in Deleting Function:', error);
            } else {
                setIsOpen(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error in Deleting Function:', error);
        }
    };

    const handleReport = async () => {
        try {
            const supabaseAccessToken = await getToken({ template: "supabase" })
            const supabase = await supabaseClient(supabaseAccessToken);
            const { error } = await supabase
                .from('poster')
                .update({
                    is_reported: "True",
                })
                .eq('poster_id', selectedPoster.poster_id);
            if (error) {
                throw new Error(`Error in Report Function: ${error.message}`);
            }
            fetchData()
            onClose();
        } catch (error) {
            console.error("Error in Report Function:", error);
        }
    }

    const handleUpdateEvent = async () => {
        if (!isInputsValid()) {
            Alert.alert(
                'Missing Information',
                'Please add a title and select a date before adding an event.',
                [{ text: 'OK' }]
            );
        }
        if (!selectedPoster || selectedPoster.user_id !== userId) {
            setError("Unauthorized action");
            return;
        }
        if (isInputsValid()) {
            try {
                if (selected !== null) {
                    const supabaseAccessToken = await getToken({ template: "supabase" })
                    const supabase = await supabaseClient(supabaseAccessToken)
                    const { error } = await supabase
                        .from('poster')
                        .update({
                            title: input1,
                            date: selected,
                            content: input2,
                            user_id: userId,
                        })
                        .eq('poster_id', selectedPoster.poster_id)
                        .eq("user_id", userId);
                    if (error) {
                        throw new Error(`Error in Update Function: ${error.message}`);
                    }
                }
                onClose();
                setIsEditModalOpen(false);

                fetchData(); //Might wanna change 
            } catch (error) {
                console.error("Error in Update Function:", error);
            }
        }
    }
    const isInputsValid = () => {
        return input1.trim() !== "" && selected !== "";
    }
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
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/*  Posters */}
            {posters.map((poster, index) => (
                <TouchableOpacity
                    key={index}
                    onPress={() => {
                        setSelectedPoster(poster);
                        if (poster.user_id === userId) {
                            setCanDeleteEdit(true);
                        }
                        setIsOpen(true);
                    }}
                >
                    <View style={styles.posterContainer}>
                        <View style={styles.posterDetails}>
                            <Image
                                style={styles.image}
                                source={poster.image ? { uri: poster.image } : img}
                            />
                            <Text style={styles.posterTitle}>{poster.title}</Text>

                            <Text style={styles.posterInfo}>
                                {poster.created_by} {new Date(poster.date + 'T00:00:00').toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'long', day: '2-digit', year: 'numeric' })} {poster.start_time}
                                {poster.end_time ? `-${poster.end_time}` : ''} {poster.location}
                            </Text>

                            <TouchableOpacity
                                onPress={(e) => {
                                    toggleGoing(poster.poster_id);
                                }}
                                style={[
                                    {
                                        width: 90,
                                        paddingVertical: 5,
                                        borderRadius: 10,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: poster.isGoing ? 'green' : 'lightgray',
                                    },
                                ]}
                            >
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                }}>Going: {poster.likes}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}

            {/* Poster Modal */}
            {selectedPoster && (
      <Modal isVisible={isOpen} onBackdropPress={onClose}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{selectedPoster.title}</Text>
          <Text style = {styles.content}>{selectedPoster.content}</Text>
          <Text style={styles.posterInfo}>
            {selectedPoster.created_by}{' '}
            {new Date(
              selectedPoster.date + 'T00:00:00'
            ).toLocaleDateString('en-US', {
              timeZone: 'America/Los_Angeles',
              month: 'long',
              day: '2-digit',
              year: 'numeric',
            })}{' '}
            {selectedPoster.start_time}
            {selectedPoster.end_time ? `-${selectedPoster.end_time}` : ''}{' '}
            {selectedPoster.location}
          </Text>

          <View style={styles.buttonContainer}>

            {!canDeleteEdit && (
              <View style={styles.buttonWrapper}>
                <Button
                  title="Report"
                  onPress={() => {
                    Alert.alert(
                      'Report',
                      'Are you sure you want to report this?',
                      [
                        { text: 'No', style: 'cancel' },
                        {
                          text: 'Yes',
                          onPress: () => {
                            handleReport();
                            onClose();
                          },
                        },
                      ]
                    );
                  }}
                />
              </View>
            )}

            {canDeleteEdit && (
              <>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Delete"
                    onPress={() => {
                      Alert.alert(
                        'Delete',
                        'Are you sure you want to delete your post?',
                        [
                          { text: 'No', style: 'cancel' },
                          {
                            text: 'Yes, Delete',
                            onPress: handleDeleteConfirmation,
                          },
                        ]
                      );
                    }}
                  />

                </View>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Edit"
                    onPress={() => {
                      setIsEditModalOpen(true);
                      onClose();
                    }}
                  />
                </View>
              </>
            )}
            <View style={styles.buttonWrapper}>
              <Button title="Close" onPress={onClose} />
            </View>
          </View>
          
        </View>
      </Modal>
            )}

            {/* User is Editing Modal */}
            <Modal
                visible={isEditModalOpen}
                onBackdropPress={() => setIsEditModalOpen(false)}
                onRequestClose={() => setIsEditModalOpen(false)}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setIsEditModalOpen(false)}>
                        <Ionicons name="close-outline" size={40} color="red" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Update your Event</Text>
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

                    <TextInput
                        placeholder="Event Content (Optional)"
                        value={input2}
                        onChangeText={handleContentChange}
                        style={styles.event_content}

                    />
                    <TouchableOpacity
                        onPress={handleUpdateEvent}
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

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    image: {
        borderRadius: 10,
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    scrollContainer: {
        padding: 10,
    },
    posterContainer: {
        overflow: 'hidden',
        width: screenWidth * 0.80,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },

    posterDetails: {
        marginBottom: 10,
    },
    posterTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    posterInfo: {
        fontSize: 16,
        color: 'gray',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 50,
        borderRadius: 10,
    },
    editModal: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        left: 20,
    },
    title: {
        fontSize: 24,
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
    buttonContainer: {
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginTop: 20,
      },
      buttonWrapper: {
        flex: 1, 
        marginHorizontal: 5,
      },
    content: {
        fontSize: 18,
    }

});