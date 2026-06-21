import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import * as XLSX from "xlsx";

export const excelRouter = createRouter({
  parse: publicQuery
    .input(
      z.object({
        base64: z.string(),
        sheetIndex: z.number().optional().default(0),
        nameColumn: z.string().optional().default("Nama"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const buffer = Buffer.from(input.base64, "base64");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        
        const sheetName = workbook.SheetNames[input.sheetIndex];
        if (!sheetName) {
          throw new Error("Sheet not found");
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        const names: string[] = [];
        const headers = Object.keys(jsonData[0] || {});

        for (const row of jsonData) {
          const nameValue =
            row[input.nameColumn] ||
            row["nama"] ||
            row["NAMA"] ||
            row["Name"] ||
            row["name"] ||
            row[headers[0]];

          if (nameValue && String(nameValue).trim()) {
            names.push(String(nameValue).trim());
          }
        }

        return {
          names,
          total: names.length,
          headers,
          sheetName,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to parse Excel";
        throw new Error(message);
      }
    }),
});
