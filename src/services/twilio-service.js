import { Client } from '@twilio/conversations';

export class TwilioService {
  static serviceInstance;
  static chatClient;

  constructor() {}

  static getInstance() {
    if (!TwilioService.serviceInstance) {
      TwilioService.serviceInstance = new TwilioService();
    }
    return TwilioService.serviceInstance;
  }

  async getChatClient(twilioToken) {
    console.log('TwilioService::getChatClient::', twilioToken);
    if (!TwilioService.chatClient && !twilioToken) {
      throw new Error('Twilio token is null or undefined');
    }
    if (!TwilioService.chatClient && twilioToken) {
      return Client.create(twilioToken).then((client) => {
        console.log('TwilioService::getChatClient::client', client);
        TwilioService.chatClient = client;
        this.addConnectionStateListener();
        return TwilioService.chatClient;
      });
    }
    return Promise.resolve().then(() => TwilioService.chatClient);
  }

  clientShutdown() {
    console.log('TwilioService::clientShutdown::');
    TwilioService.chatClient?.shutdown();
    TwilioService.chatClient = null;
  }

  addConnectionStateListener() {
    console.log('TwilioService::addConnectionStateListener::');
    if (!TwilioService.chatClient) {
      throw new Error('Twilio client is null or undefined');
    }
    TwilioService.chatClient.on('connectionStateChanged', (state) => {
      console.log('TwilioService::addConnectionStateListener::state::');
      if (state === 'connecting') {
        console.log('TwilioService::addConnectionStateListener::state::', state);
        console.log('Connecting to Twilio…');
      }
      if (state === 'connected') {
        console.log('You are connected.');
      }
      if (state === 'disconnecting') {
        console.log('Disconnecting from Twilio…');
      }
      if (state === 'disconnected') {
        console.log('Disconnected.');
      }
      if (state === 'denied') {
        console.log('Failed to connect.');
      }
    });
    return TwilioService.chatClient;
  }

  addTokenListener(getToken) {
    console.log('TwilioService::addTokenListener::', getToken);
    if (!TwilioService.chatClient) {
      throw new Error('Twilio client is null or undefined');
    }
    TwilioService.chatClient.on('tokenAboutToExpire', () => {
      getToken().then(TwilioService.chatClient.updateToken);
    });

    TwilioService.chatClient.on('tokenExpired', () => {
      getToken().then(TwilioService.chatClient.updateToken);
    });
    return TwilioService.chatClient;
  }

  parseConversations(conversations) {
    return conversations.map(this.parseConversation);
  }

  parseConversation(conversation) {
    return {
      id: conversation.sid,
      name: conversation.friendlyName,
      createdAt: conversation.dateCreated,
      updatedAt: conversation.dateUpdated,
      lastMessageTime: conversation.lastMessage?.dateCreated ?? conversation.dateUpdated ?? conversation.dateCreated,
    };
  }

  parseMessages(messages) {
    return messages.map(this.parseMessage).reverse();
  }

  parseMessage(message) {
    return {
      _id: message.sid,
      text: message.body,
      createdAt: message.dateCreated,
      user: {
        _id: message.author,
        name: message.author,
      },
      received: true,
    };
  }
}
