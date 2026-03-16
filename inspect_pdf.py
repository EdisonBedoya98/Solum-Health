import sys
from pypdf import PdfReader

def inspect_pdf(file_path):
    reader = PdfReader(file_path)
    fields = reader.get_fields()
    if fields:
        for field_name, field in fields.items():
            print(f"Field Name: {field_name}")
            print(f"  Field Type: {field.get('/FT')}")
            print(f"  Value: {field.get('/V')}")
    else:
        print("No form fields found.")

inspect_pdf('apps/web/public/07-service-request-form.pdf')
