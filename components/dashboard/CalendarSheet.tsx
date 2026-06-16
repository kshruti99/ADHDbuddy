import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, X } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { DayCalendar } from '@/components/DayCalendar';
import { AnchorEditorModal } from '@/components/modals/AnchorEditorModal';
import { useAnchors } from '@/hooks/useAnchors';
import type { AnchorItem } from '@/lib/supabase';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function CalendarSheet({ visible, onClose }: Props) {
  const anchors = useAnchors();
  const [editingAnchor, setEditingAnchor] = useState<AnchorItem | null | undefined>(undefined);

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Calendar size={18} color={colors.primary} strokeWidth={2} />
              <Text style={styles.title}>Today's Anchors</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={20} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <DayCalendar
                anchors={anchors.anchors}
                onAdd={() => setEditingAnchor(null)}
                onEdit={(anchor) => setEditingAnchor(anchor)}
              />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <AnchorEditorModal
        visible={editingAnchor !== undefined}
        editing={editingAnchor ?? null}
        onClose={() => setEditingAnchor(undefined)}
        onSave={async (title, time, commute, prep) => {
          const ok = await anchors.save(title, time, commute, prep, editingAnchor ?? null);
          if (ok) setEditingAnchor(undefined);
          return ok ?? false;
        }}
        onRemove={async () => {
          if (editingAnchor) await anchors.removeFromToday(editingAnchor);
          setEditingAnchor(undefined);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
});
