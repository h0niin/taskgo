import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RunnerFeedScreen } from '../screens/runner/RunnerFeedScreen';
import { MyErrandsScreen } from '../screens/runner/MyErrandsScreen';
import { RunnerNegotiationScreen } from '../screens/runner/RunnerNegotiationScreen';
import { RunnerStackParamList, RunnerTabParamList } from './types';
import { Compass, ClipboardList } from 'lucide-react-native';
import { Card, Neutral } from '../theme';

const Tab = createBottomTabNavigator<RunnerTabParamList>();
const Stack = createNativeStackNavigator<RunnerStackParamList>();

function RunnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Card.cream,
          borderTopWidth: 4,
          borderTopColor: Neutral.black,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Neutral.black,
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontWeight: '900',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={RunnerFeedScreen}
        options={{
          tabBarLabel: 'Errand Feed',
          tabBarIcon: ({ color, size }) => (
            <Compass color={color} size={size || 22} strokeWidth={2.5} />
          ),
        }}
      />
      <Tab.Screen
        name="MyErrands"
        component={MyErrandsScreen}
        options={{
          tabBarLabel: 'My Errands',
          tabBarIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size || 22} strokeWidth={2.5} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RunnerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RunnerTabs" component={RunnerTabs} />
      <Stack.Screen name="RunnerNegotiation" component={RunnerNegotiationScreen} />
    </Stack.Navigator>
  );
}
