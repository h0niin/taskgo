import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerDashboardScreen } from '../screens/customer/CustomerDashboardScreen';
import { CreateOrderScreen } from '../screens/customer/CreateOrderScreen';
import { CustomerProfileScreen } from '../screens/customer/CustomerProfileScreen';
import { OrderDetailScreen } from '../screens/customer/OrderDetailScreen';
import { NegotiationThreadScreen } from '../screens/customer/NegotiationThreadScreen';
import { TaskPaymentScreen } from '../screens/customer/TaskPaymentScreen';
import { ProofReviewScreen } from '../screens/customer/ProofReviewScreen';
import { AdditionalPaymentScreen } from '../screens/customer/AdditionalPaymentScreen';
import { ReceiptScreen } from '../screens/customer/ReceiptScreen';
import { CustomerStackParamList, CustomerTabParamList } from './types';
import { LayoutDashboard, PlusCircle, User } from 'lucide-react-native';
import { Card, Neutral } from '../theme';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const Stack = createNativeStackNavigator<CustomerStackParamList>();

function CustomerTabs() {
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

export function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="NegotiationThread" component={NegotiationThreadScreen} />
      <Stack.Screen name="TaskPayment" component={TaskPaymentScreen} />
      <Stack.Screen name="ProofReview" component={ProofReviewScreen} />
      <Stack.Screen name="AdditionalPayment" component={AdditionalPaymentScreen} />
      <Stack.Screen name="Receipt" component={ReceiptScreen} />
    </Stack.Navigator>
  );
}
