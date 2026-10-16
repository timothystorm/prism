import { describe, expect, test } from "vitest";
import {
	ColumnNameSchema,
	ColumnSchema,
	ColumnsSchema,
	ColumnsStateSchema,
	initialColumnsState,
} from "./columns-state";

describe("ColumnNameSchema", () => {
	test.each(["trackId", "status", "estimatedDeliveryDate"])(
		"accepts the column name %s",
		(name) => {
			expect(ColumnNameSchema.parse(name)).toBe(name);
		},
	);

	test.each(["unknown", "", null, undefined, 42])(
		"rejects an invalid column name: %j",
		(name) => {
			expect(ColumnNameSchema.safeParse(name).success).toBe(false);
		},
	);
});

describe("ColumnSchema", () => {
	test.each([
		{ name: "trackId" },
		{ name: "status", sortDirection: "asc" },
		{ name: "estimatedDeliveryDate", sortDirection: "desc" },
	])("accepts a column with optional sorting: %j", (column) => {
		expect(ColumnSchema.parse(column)).toEqual(column);
	});

	test.each([
		{},
		{ name: "unknown" },
		{ name: "trackId", sortDirection: "ascending" },
		{ name: "trackId", sortDirection: null },
		{ name: "trackId", sortDirection: 1 },
		null,
	])("rejects an invalid column: %j", (column) => {
		expect(ColumnSchema.safeParse(column).success).toBe(false);
	});
});

describe("ColumnsSchema", () => {
	test("accepts trackId without any optional columns", () => {
		expect(ColumnsSchema.parse([{ name: "trackId" }])).toEqual([
			{ name: "trackId" },
		]);
	});

	test("preserves display order without requiring trackId to be first", () => {
		const columns = [
			{ name: "estimatedDeliveryDate", sortDirection: "desc" },
			{ name: "trackId" },
			{ name: "status", sortDirection: "asc" },
		];

		expect(ColumnsSchema.parse(columns)).toEqual([
			{ name: "estimatedDeliveryDate", sortDirection: "desc" },
			{ name: "trackId" },
			{ name: "status", sortDirection: "asc" },
		]);
	});

	test.each([
		{ columns: [] },
		{ columns: [{ name: "status" }] },
		{
			columns: [{ name: "status" }, { name: "estimatedDeliveryDate" }],
		},
	])("rejects selections missing trackId: $columns", ({ columns }) => {
		const result = ColumnsSchema.safeParse(columns);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						message: "The 'trackId' column is required",
					}),
				]),
			);
		}
	});

	test.each([
		{
			columns: [{ name: "trackId" }, { name: "trackId" }],
		},
		{
			columns: [
				{ name: "trackId" },
				{ name: "status", sortDirection: "asc" },
				{ name: "status", sortDirection: "desc" },
			],
		},
	])(
		"rejects duplicate names regardless of sorting: $columns",
		({ columns }) => {
			const result = ColumnsSchema.safeParse(columns);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ message: "Columns must be unique" }),
					]),
				);
			}
		},
	);

	test.each([
		{ columns: [{ name: "trackId" }, { name: "unknown" }] },
		{ columns: [{ name: "trackId", sortDirection: "ascending" }] },
		{ columns: { name: "trackId" } },
		{ columns: null },
	])("rejects malformed selections: $columns", ({ columns }) => {
		expect(ColumnsSchema.safeParse(columns).success).toBe(false);
	});
});

describe("ColumnsStateSchema", () => {
	test("accepts a state with only the required column", () => {
		expect(
			ColumnsStateSchema.parse({ selectedColumns: [{ name: "trackId" }] }),
		).toEqual({ selectedColumns: [{ name: "trackId" }] });
	});

	test.each([
		{},
		{ selectedColumns: null },
		{ selectedColumns: [] },
		{ selectedColumns: [{ name: "status" }] },
		{ selectedColumns: [{ name: "trackId" }, { name: "trackId" }] },
		{ selectedColumns: [{ name: "trackId", sortDirection: "invalid" }] },
	])("rejects a missing or invalid selection: %j", (state) => {
		expect(ColumnsStateSchema.safeParse(state).success).toBe(false);
	});

	test("accepts the initial columns state", () => {
		expect(ColumnsStateSchema.parse(initialColumnsState)).toEqual(
			initialColumnsState,
		);
	});
});
