import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RunnerFeedScreen } from '../screens/runner/RunnerFeedScreen';
import { MyErrandsScreen } from '../screens/runner/MyErrandsScreen';
import { RunnerTabParamList } from './types';
import { Compass, ClipboardList } from 'lucide-react-native';
import { Card, Neutral } from '../theme';

const Tab = createBottomTabNavigator<RunnerTabParamList>();

export function RunnerNavigator() {
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

