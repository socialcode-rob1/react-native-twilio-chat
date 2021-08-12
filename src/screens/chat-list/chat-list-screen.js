import React, { useState, useLayoutEffect, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { colors } from '../../theme';
import { routes } from '../../app';
import { TwilioService } from '../../services/twilio-service';
import { getToken } from '../../services/api-service';
import { useApp } from '../../app-context';

import { ChatListLoader } from './components/chat-list-loader';
import { ChatListEmpty } from './components/chat-list-empty';
import { ChatListItem } from './components/chat-list-item';

export function ChatListScreen({ navigation, route }) {
  const { username } = route.params;
  const [loading, setLoading] = useState(true);
  const { conversations, updateConversations } = useApp();
  const conversationPaginator = useRef();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate(routes.ChatCreat.name)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const setConversationEvents = useCallback(
    (client) => {
      client.on('messageAdded', (message) => {
        console.log('ChatListScreen::setConversationEvents::event::messageAdded::message', message);
        updateConversations((prevConversations) =>
          prevConversations.map((conversation) =>
            conversation.id === message.conversation.sid
              ? { ...conversation, lastMessageTime: message.dateCreated }
              : conversation,
          ),
        );
      });
      return client;
    },
    [updateConversations],
  );

  const getSubscribedConversations = useCallback(
    (client) =>
      client.getSubscribedConversations().then((paginator) => {
        conversationPaginator.current = paginator;
        const newConversations = TwilioService.getInstance().parseConversations(conversationPaginator.current.items);
        console.log('ChatListScreen::getSubscribedConversations::conversations', newConversations);
        updateConversations(newConversations);
      }),
    [updateConversations],
  );

  useEffect(() => {
    getToken(username)
      .then((token) => TwilioService.getInstance().getChatClient(token))
      .then(() => TwilioService.getInstance().addTokenListener(getToken))
      .then(setConversationEvents)
      .then(getSubscribedConversations)
      .catch((err) => showMessage({ message: err.message, type: 'danger' }));
    // .finally(() => setLoading(false));

    return () => TwilioService.getInstance().clientShutdown();
  }, [username, setConversationEvents, getSubscribedConversations]);

  const sortedConversations = useMemo(
    () =>
      conversations.sort(
        (conversationA, conversationB) => conversationB.lastMessageTime - conversationA.lastMessageTime,
      ),
    [conversations],
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={sortedConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            conversation={item}
            onPress={() => navigation.navigate(routes.ChatRoom.name, { conversationId: item.id, identity: username })}
          />
        )}
        ListEmptyComponent={<ChatListEmpty />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.snow,
  },
  addButton: {
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.white,
  },
});
