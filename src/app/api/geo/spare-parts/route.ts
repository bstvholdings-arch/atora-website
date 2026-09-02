/**
 * /api/geo/spare-parts — live, data-driven Spare Parts GEO (V3 §4–§11, §32).
 *
 * Reads the LIVE product database and classifies every actual spare-part
 * product into a standard GEO category. Real product names are preserved;
 * nothing is renamed or invented. Consumed by AI answer engines and used to
 * generate the V3 §37 classification table.
 */
import { NextResponse } from 'next/server';
import { buildSparePartsGEO, STANDARD_SPARE_PART_CATEGORIES } from '@/lib/spareParts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const geo = await buildSparePartsGEO();
  return NextResponse.json({
    entity: 'ATORA',
    primaryEntity: 'Malaysia Aircond Wholesale & Air Conditioning Parts Supplier',
    taxonomyCap: 100,
    taxonomySize: geo.taxonomySize,
    totalActualSpareParts: geo.total,
    categoriesRepresented: geo.categoriesRepresented,
    classifications: geo.classifications,
    standardCategories: STANDARD_SPARE_PART_CATEGORIES.map((c) => ({
      key: c.key,
      standardName: c.standardName,
      dbCategorySlug: c.dbCategorySlug ?? null,
      confidence: c.confidence,
      adminVerified: c.adminVerified,
    })),
  });
}
