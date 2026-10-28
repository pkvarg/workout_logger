import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { Palette } from './theme'
import { font, radius } from './theme'

const label = (c: Palette) => ({
  color: c.muted,
  fontFamily: font.semi,
  fontSize: 12,
  marginBottom: 8,
  marginTop: 4,
})

export function EditItemSheet({
  c,
  bottomInset,
  visible,
  title,
  nameLabel,
  namePlaceholder,
  extraLabel,
  extraPlaceholder,
  name0,
  extra0,
  deleteLabel,
  onClose,
  onSave,
  onDelete,
}: {
  c: Palette
  bottomInset: number
  visible: boolean
  title: string
  nameLabel: string
  namePlaceholder?: string
  extraLabel?: string
  extraPlaceholder?: string
  name0: string
  extra0: string
  deleteLabel: string
  onClose: () => void
  onSave: (name: string, extra: string) => Promise<void> | void
  onDelete: () => Promise<void> | void
}) {
  const [name, setName] = useState(name0)
  const [extra, setExtra] = useState(extra0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setName(name0)
    setExtra(extra0)
  }, [name0, extra0, visible])

  const save = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      await onSave(name.trim(), extra.trim())
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = () => {
    Alert.alert(deleteLabel, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true)
          try {
            await onDelete()
          } finally {
            setBusy(false)
          }
        },
      },
    ])
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.paper, paddingBottom: 24 + bottomInset }]}>
        <View style={[styles.grip, { backgroundColor: c.lineStrong }]} />
        <Text
          style={{ color: c.ink, fontFamily: font.displayMedium, fontSize: 20, marginBottom: 14 }}
        >
          {title}
        </Text>

        <Text style={label(c)}>{nameLabel}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={namePlaceholder}
          placeholderTextColor={c.muted}
          autoCapitalize="words"
          style={[styles.input, { color: c.ink, backgroundColor: c.card, borderColor: c.line }]}
        />

        {extraLabel ? (
          <>
            <Text style={label(c)}>{extraLabel}</Text>
            <TextInput
              value={extra}
              onChangeText={setExtra}
              placeholder={extraPlaceholder}
              placeholderTextColor={c.muted}
              autoCapitalize="words"
              style={[styles.input, { color: c.ink, backgroundColor: c.card, borderColor: c.line }]}
            />
          </>
        ) : null}

        <Pressable
          onPress={save}
          disabled={busy || !name.trim()}
          style={({ pressed }) => [
            styles.save,
            { backgroundColor: c.accent, opacity: !name.trim() ? 0.4 : pressed || busy ? 0.9 : 1 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={c.onAccent} />
          ) : (
            <Text style={{ color: c.onAccent, fontFamily: font.bold, fontSize: 15 }}>Save</Text>
          )}
        </Pressable>

        <Pressable
          onPress={confirmDelete}
          disabled={busy}
          style={[styles.delete, { borderColor: c.lineStrong }]}
        >
          <Text style={{ color: c.danger, fontFamily: font.bold, fontSize: 14.5 }}>
            {deleteLabel}
          </Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(20,8,14,0.42)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  grip: {
    width: 38,
    height: 4,
    borderRadius: 99,
    alignSelf: 'center',
    marginVertical: 6,
    marginBottom: 14,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontFamily: font.regular,
    fontSize: 15,
    marginBottom: 12,
  },
  save: { borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  delete: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
})
