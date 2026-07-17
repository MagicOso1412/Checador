import { useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { StatusPill } from "@/components/attendance/ui-rows";
import { palette } from "@/constants/palette";
import { HISTORY_RECORDS, STATUS_LABELS, STATUS_STYLES } from "@/lib/mock-data";

export default function HistoryScreen() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => HISTORY_RECORDS.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Historial Local"
        subtitle={`${HISTORY_RECORDS.length} registros hoy`}
        onBack={() => router.back()}
        className="bg-primary pb-4"
      />

      <View className="border-b border-border px-4 py-3">
        <TextInput
          className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm text-foreground"
          placeholder="Buscar por nombre…"
          placeholderTextColor={palette.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => {
          const style = STATUS_STYLES[item.status];
          return (
            <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
              <View className="h-11 w-11 overflow-hidden rounded-xl bg-muted">
                <Image
                  source={{ uri: item.photo }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {item.employee} · {item.time} · {item.type}
                </Text>
              </View>
              <StatusPill
                label={STATUS_LABELS[item.status]}
                bgClassName={style.bg}
                textClassName={style.text}
              />
            </View>
          );
        }}
      />
    </View>
  );
}
