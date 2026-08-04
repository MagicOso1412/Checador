import { getDatabase } from "../../database/db";
import { ConsentimientoBiometrico } from "../../domain/entities/ConsentimientoBiometrico";
import type { IConsentimientoBiometricoRepository } from "../../domain/repositories/IConsentimientoBiometricoRepository";

type ConsentimientoRow = {
  trabajador_id: string;
  version_texto: string;
  aceptado_en: string;
  revocado_en: string | null;
};

function toEntity(row: ConsentimientoRow): ConsentimientoBiometrico {
  return new ConsentimientoBiometrico(
    row.trabajador_id,
    row.version_texto,
    new Date(row.aceptado_en),
    row.revocado_en ? new Date(row.revocado_en) : null,
  );
}

export class SQLiteConsentimientoBiometricoRepository implements IConsentimientoBiometricoRepository {
  async obtenerPorTrabajador(trabajadorId: string): Promise<ConsentimientoBiometrico | null> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<ConsentimientoRow>(
      `SELECT trabajador_id, version_texto, aceptado_en, revocado_en
       FROM consentimientos_biometricos WHERE trabajador_id = ?`,
      [trabajadorId],
    );

    return row ? toEntity(row) : null;
  }

  async otorgar(trabajadorId: string, versionTexto: string): Promise<ConsentimientoBiometrico> {
    const db = await getDatabase();
    const aceptadoEn = new Date();

    // Upsert vía `INSERT OR REPLACE`: si ya había un consentimiento (vigente
    // o revocado) para este trabajador, lo reemplaza entero — mismo criterio
    // documentado en `IConsentimientoBiometricoRepository.otorgar`.
    await db.runAsync(
      `INSERT OR REPLACE INTO consentimientos_biometricos (trabajador_id, version_texto, aceptado_en, revocado_en)
       VALUES (?, ?, ?, NULL)`,
      [trabajadorId, versionTexto, aceptadoEn.toISOString()],
    );

    return new ConsentimientoBiometrico(trabajadorId, versionTexto, aceptadoEn, null);
  }

  async revocar(trabajadorId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE consentimientos_biometricos SET revocado_en = ? WHERE trabajador_id = ?`,
      [new Date().toISOString(), trabajadorId],
    );
  }
}
