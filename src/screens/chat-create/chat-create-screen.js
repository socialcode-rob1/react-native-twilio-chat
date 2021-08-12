import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { colors } from '../../theme';
import { images } from '../../assets';
import { TwilioService } from '../../services/twilio-service';
import { LoadingOverlay } from '../../components';
import { useApp } from '../../app-context';

export function ChatCreateScreen() {
  const [conversationName, setConversationName] = useState('');
  const [loading, setLoading] = useState(false);
  const { conversations, updateConversations } = useApp();

  const onAddConversation = (conversation) => {
    const newConversation = TwilioService.getInstance().parseConversation(conversation);
    updateConversations(conversations.concat(newConversation));
  };

  const onCreateOrJoin = () => {
    setLoading(true);
    TwilioService.getInstance()
      .getChatClient()
      .then((client) =>
        client
          .getConversationByUniqueName(conversationName)
          .then((conversation) =>
            conversation.conversationState.status !== 'joined' ? conversation.join() : conversation,
          )
          .then(onAddConversation)
          .catch(() =>
            client
              .createConversation({ uniqueName: conversationName, friendlyName: conversationName })
              .then((conversation) => {
                onAddConversation(conversation);
                conversation.join();
              }),
          ),
      )
      .then(() => showMessage({ message: 'You have joined.' }))
      .catch((err) => showMessage({ message: err.message, type: 'danger' }));
    // .finally(() => setLoading(false));
  };

  return (
    <View style={styles.screen}>
      <Image style={styles.logo} source={images.message} />
      <TextInput
        value={conversationName}
        onChangeText={setConversationName}
        style={styles.input}
        placeholder="Conversation Name"
        placeholderTextColor={colors.ghost}
      />
      <TouchableOpacity style={styles.button} onPress={onCreateOrJoin}>
        <Text style={styles.buttonText}>Create Or Join</Text>
      </TouchableOpacity>
      {loading && <LoadingOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.whisper,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  input: {
    width: 280,
    height: 50,
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.eclipse,
    marginTop: 32,
    marginBottom: 16,
  },
  button: {
    width: 280,
    height: 50,
    backgroundColor: colors.malibu,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    color: colors.white,
  },
});
