import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { Neutral } from '../theme';
import type { OrderStatus } from '../types/models';
import { humanizeStatus } from '../utils/format';

const STATUSES: OrderStatus[] = [
  'PLACED',
  'BIDDING',
  'AWAITING_PAYMENT',
  'ASSIGNED',
  'IN_PROGRESS',
  'PROOF_SUBMITTED',
  'AWAITING_ADDITIONAL_PAYMENT',
  'COMPLETED',
  'CANCELLED',
];

interface OrderStatusFilterProps {
  value: OrderStatus[];
  onChange: (statuses: OrderStatus[]) => void;
  counts: Partial<Record<OrderStatus, number>>;
  allCount: number;
  statuses?: OrderStatus[];
}

export function OrderStatusFilter({
  value,
  onChange,
  counts,
  allCount,
  statuses = STATUSES,
}: OrderStatusFilterProps) {
  const toggleStatus = (status: OrderStatus) => {
    onChange(
      value.includes(status)
        ? value.filter((selected) => selected !== status)
        : [...value, status],
    );
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {(['ALL', ...statuses] as const).map((status) => {
        const isAll = status === 'ALL';
        const selected = isAll ? value.length === 0 : value.includes(status);
        return (
          <TouchableOpacity
            key={status}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (isAll) onChange([]);
              else toggleStatus(status);
            }}
            style={{
              marginRight: 8,
              borderWidth: 2,
              borderColor: Neutral.black,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: selected ? Neutral.black : '#FFFFFF',
            }}
          >
            <Text
              style={{
                color: selected ? Neutral.white : Neutral.black,
                fontSize: 11,
                fontWeight: '900',
              }}
            >
              {status === 'ALL'
                ? `ALL (${allCount})`
                : `${humanizeStatus(status).toUpperCase()} (${counts[status] ?? 0})`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
