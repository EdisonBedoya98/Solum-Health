import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateFilledPdf(
  formData: any,
  pdfUrl: string,
): Promise<string> {
  // 1. Fetch the empty PDF template
  const existingPdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());

  // 2. Load the PDF Document
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0]; // Assuming it's a 1-page form for now

  // 3. Setup font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;
  const color = rgb(0, 0, 0); // Black text

  // 4. Coordinate Mappings (Approximate based on 8.5x11 PDF size 612x792)
  // Mapping the field name from the extraction JSON to the (x, y) coordinates on the PDF.
  // Origin (0,0) is bottom-left corner in PDF-lib.

  const mappings: {
    [key: string]: { x: number; y: number; maxLength?: number };
  } = {
    // Header
    payer_name: { x: 150, y: 735 },
    request_date: { x: 620, y: 735 }, // X might need to be lower if form width is smaller
    payer_fax: { x: 150, y: 710 },
    payer_phone: { x: 620, y: 710 },

    // Section A: Member Info
    member_name: { x: 260, y: 658 },
    member_dob: { x: 450, y: 658 },
    member_gender: { x: 600, y: 658 },
    member_id: { x: 200, y: 625 },
    group_number: { x: 200, y: 595 },
    member_phone: { x: 200, y: 565 },
    member_address: { x: 200, y: 535 },

    // Section B: Provider Info
    provider_name: { x: 200, y: 480 },
    provider_npi: { x: 200, y: 450 },
    provider_facility: { x: 250, y: 420 },
    provider_tax_id: { x: 200, y: 390 },
    provider_phone: { x: 200, y: 360 },
    provider_fax: { x: 200, y: 330 },
    provider_address: { x: 200, y: 300 },

    // Section C: Referring Provider
    referring_provider_name: { x: 250, y: 245 },
    referring_provider_npi: { x: 250, y: 215 },
    referring_provider_phone: { x: 250, y: 185 },

    // Section D: Service Info
    service_type: { x: 250, y: 125 },
    service_setting: { x: 250, y: 105 },
    diagnosis_descriptions: { x: 250, y: 85 },
    start_date: { x: 250, y: 65 },
    end_date: { x: 400, y: 65 },
    num_sessions_units: { x: 250, y: 45 },
    frequency: { x: 450, y: 45 },

    // Attestation (bottom)
    attestation_signature_name: { x: 150, y: -20 }, // Off page?
    attestation_date: { x: 400, y: -20 },
    license_number: { x: 500, y: -20 },
  };

  // 5. Draw text onto the PDF
  Object.keys(mappings).forEach((key) => {
    const value = formData[key];
    if (value) {
      const { x, y } = mappings[key];
      page.drawText(String(value), {
        x,
        y,
        size: fontSize,
        font,
        color,
      });
    }
  });

  // Handle arrays like medications, assessments, cpt codes, icd10 codes
  if (formData.icd10_codes && formData.icd10_codes.length > 0) {
    page.drawText(formData.icd10_codes.join(", "), {
      x: 250,
      y: 105,
      size: fontSize,
      font,
      color,
    });
  }
  if (formData.cpt_codes && formData.cpt_codes.length > 0) {
    page.drawText(formData.cpt_codes.join(", "), {
      x: 250,
      y: 125,
      size: fontSize,
      font,
      color,
    });
  }

  // 6. Serialize and create Blob URL
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
  return URL.createObjectURL(blob);
}
