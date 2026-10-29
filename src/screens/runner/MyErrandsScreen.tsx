import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BrutalBadge, BrutalCard } from '../../components';
import { Canvas, Card, Neutral } from '../../theme';
import {
  effectiveRunnerId,
  selectRunnerActive,
  selectRunnerBiddingThreads,
  selectRunnerDone,
  useStore,
} from '../../store';
import { formatRupees } from '../../utils/format';

type TabKind = 'Bidding' | 'Active' | 'Done';

export function MyErrandsScreen() {
  const [tab, setTab] = useState<TabKind>('Active');
  const currentUser = useStore((s) => s.currentUser);
  const adminMode = useStore((s) => s.adminMode);
  const orders = useStore((s) => s.orders);

  const runnerId = effectiveRunnerId(currentUser, adminMode);

  const biddingList = selectRunnerBiddingThreads(orders, runnerId);
  const activeList = selectRunnerActive(orders, runnerId);
  const doneList = selectRunnerDone(orders, runnerId);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Canvas.orange }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      {/* Tab Switcher */}
      <View
        style={{
          flexDirection: 'row',
          borderWidth: 4,
          borderColor: Neutral.black,
          borderRadius: 9999,
          backgroundColor: Card.cream,
          overflow: 'hidden',
        }}
      >
        {(['Bidding', 'Active', 'Done'] as TabKind[]).map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                paddingVertical: 12,
                backgroundColor: active ? Neutral.black : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontWeight: '900',
                  fontSize: 13,
                  color: active ? Neutral.white : Neutral.black,
                  textTransform: 'uppercase',
                }}
              >
                {t}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab Content */}
      {tab === 'Bidding' && (
        <View style={{ gap: 12 }}>
          {biddingList.length === 0 ? (
            <BrutalCard backgroundColor={Card.cream}>
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                  No Active Bids
                </Text>
                <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                  Browse the feed and place your quotes!
                </Text>
              </View>
            </BrutalCard>
          ) : (
            biddingList.map(({ order, thread }) => (
              <BrutalCard key={thread.id} backgroundColor={Card.cream}>
                <View style={{ padding: 16, gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <BrutalBadge label={order.status} color="#8B5CF6" />
                    <BrutalBadge label={thread.status} color={Neutral.black} />
                  </View>
                  <Text style={{ fontWeight: '900', fontSize: 16 }}>
                    {order.stops[0]?.address} → {order.stops[order.stops.length - 1]?.address}
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#4B5563' }}>
                    Latest offer: {formatRupees(thread.offers[thread.offers.length - 1]?.price ?? 0)}
                  </Text>
                </View>
              </BrutalCard>
            ))
          )}
        </View>
      )}

      {tab === 'Active' && (
        <View style={{ gap: 12 }}>
          {activeList.length === 0 ? (
            <BrutalCard backgroundColor={Card.cream}>
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                  No Tasks In Progress
                </Text>
                <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                  Once a customer accepts your bid & pays the advance, it shows here!
                </Text>
              </View>
            </BrutalCard>
          ) : (
            activeList.map((order) => (
              <BrutalCard key={order.id} backgroundColor={Card.cream}>
                <View style={{ padding: 16, gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <BrutalBadge label={order.status} color="#14B8A6" />
                    <Text style={{ fontWeight: '900', fontSize: 14 }}>
                      Fee: {formatRupees(order.agreedFee ?? 0)}
                    </Text>
                  </View>
                  <Text style={{ fontWeight: '900', fontSize: 16 }}>
                    {order.stops[0]?.address} → {order.stops[order.stops.length - 1]?.address}
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#4B5563' }}>
                    Step: {order.progressStep ?? 'Awaiting dispatch'}
                  </Text>
                </View>
              </BrutalCard>
            ))
          )}
        </View>
      )}

      {tab === 'Done' && (
        <View style={{ gap: 12 }}>
          {doneList.length === 0 ? (
            <BrutalCard backgroundColor={Card.cream}>
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                  No Completed Tasks Yet
                </Text>
                <Text style={{ fontWeight: '700', fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                  Complete tasks to build your earnings record.
                </Text>
              </View>
            </BrutalCard>
          ) : (
            doneList.map((order) => (
              <BrutalCard key={order.id} backgroundColor={Card.mint}>
                <View style={{ padding: 16, gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <BrutalBadge label="COMPLETED" color="#10B981" />
                    <Text style={{ fontWeight: '900', fontSize: 14 }}>
                      Earned: {formatRupees(order.agreedFee ?? 0)}
                    </Text>
                  </View>
                  <Text style={{ fontWeight: '900', fontSize: 16 }}>
                    {order.stops[0]?.address} → {order.stops[order.stops.length - 1]?.address}
                  </Text>
                  {order.storeBillAmount ? (
                    <Text style={{ fontWeight: '700', fontSize: 13, color: '#374151' }}>
                      Reimbursed Bill: {formatRupees(order.storeBillAmount)}
                    </Text>
                  ) : null}
                </View>
              </BrutalCard>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

