import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomerDashboardScreen } from '../screens/customer/CustomerDashboardScreen';
import { CreateOrderScreen } from '../screens/customer/CreateOrderScreen';
import { CustomerProfileScreen } from '../screens/customer/CustomerProfileScreen';
import { CustomerTabParamList } from './types';
import { LayoutDashboard, PlusCircle, User } from 'lucide-react-native';
import { Card, CTA, Neutral } from '../theme';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

export function CustomerNavigator() {
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
        name="Dashboard"
        component={CustomerDashboardScreen}
        options={{
          tabBarLabel: 'Errands',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size || 22} strokeWidth={2.5} />
          ),
        }}
      />
      <Tab.Screen
        name="NewOrder"
        component={CreateOrderScreen}
        options={{
          tabBarLabel: 'Post Task',
          tabBarIcon: ({ color, size }) => (
            <PlusCircle color={color} size={size || 22} strokeWidth={2.5} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={CustomerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size || 22} strokeWidth={2.5} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

