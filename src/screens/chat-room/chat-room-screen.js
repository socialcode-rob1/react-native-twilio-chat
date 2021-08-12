import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { showMessage } from 'react-native-flash-message';

import { colors } from '../../theme';
import { TwilioService } from '../../services/twilio-service';
import { ChatLoader } from './components/chat-loader';

export function ChatRoomScreen({ route }) {
  const { conversationId, identity } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const chatClientConversation = useRef();
  const chatMessagesPaginator = useRef();

  const setConversationEvents = useCallback((conversation) => {
    chatClientConversation.current = conversation;
    chatClientConversation.current.on('messageAdded', (message) => {
      const newMessage = TwilioService.getInstance().parseMessage(message);
      const { giftedId } = message.attributes;
      if (giftedId) {
        setMessages((prevMessages) => {
          if (prevMessages.some(({ _id }) => _id === giftedId)) {
            return prevMessages.map((m) => (m._id === giftedId ? newMessage : m));
          }
          return [newMessage, ...prevMessages];
        });
      }
    });
    return chatClientConversation.current;
  }, []);

  useEffect(() => {
    TwilioService.getInstance()
      .getChatClient()
      .then((client) => client.getConversationBySid(conversationId))
      .then((conversation) => setConversationEvents(conversation))
      .then((currentConversation) => currentConversation.getMessages())
      .then((paginator) => {
        chatMessagesPaginator.current = paginator;
        const newMessages = TwilioService.getInstance().parseMessages(paginator.items);
        setMessages(newMessages);
      })
      .catch((err) => showMessage({ message: err.message, type: 'danger' }));
    // .finally(() => setLoading(false));
  }, [conversationId, setConversationEvents]);

  const onSend = useCallback((newMessages = []) => {
    const attributes = { giftedId: newMessages[0]._id };
    setMessages((prevMessages) => GiftedChat.append(prevMessages, newMessages));
    chatClientConversation.current?.sendMessage(newMessages[0].text, attributes);
  }, []);

  return (
    <View style={styles.screen}>
      <GiftedChat
        messagesContainerStyle={styles.messageContainer}
        messages={messages}
        renderAvatarOnTop
        onSend={(messages) => onSend(messages)}
        user={{ _id: identity }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: colors.white,
  },
  messageContainer: {
    backgroundColor: colors.snow,
  },
});
