from flask import Flask, render_template, request, send_file, jsonify
from docxtpl import DocxTemplate
from num2words import num2words
from datetime import datetime
from docx2pdf import convert
import os
import time

app = Flask(__name__)

def calculate_bill(items):
    subtotal = 0
    for item in items:
        # Convert inputs safely
        qty = float(item.get('qty', 0)) if str(item.get('qty', 0)).replace('.','',1).isdigit() else 0
        rate = float(item.get('rate', 0)) if str(item.get('rate', 0)).replace('.','',1).isdigit() else 0
        
        item['qty'] = int(qty) if qty.is_integer() else qty
        item['rate'] = int(rate) if rate.is_integer() else rate
        
        item['total'] = item['qty'] * item['rate']
        subtotal += item['total']

    net_total = subtotal
    return subtotal, net_total

def amount_to_words(amount):
    return num2words(int(amount), lang='en_IN').title() + " Rupees Only"

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/generate", methods=["POST"])
def generate():
    try:
        data = request.json
        name = data.get('name', '')
        address = data.get('address', '')
        mobile = data.get('mobile', '')
        invoice_no = data.get('invoice_no', str(int(time.time())))
        items = data.get('items', [])

        subtotal, net_total = calculate_bill(items)

        # Context identical to bill.py
        context = {
            "name": name,
            "address": address,
            "mobile": mobile,
            "invoice_no": invoice_no,
            "date": datetime.now().strftime("%d-%m-%Y"),
            "items": items,
            "total_amount": f"₹{subtotal:,.2f}",
            "cgst": None,
            "sgst": None,
            "net_amount": f"₹{net_total:,.2f}",
            "amount_words": amount_to_words(net_total),
        }

        # Use our patched layout template
        doc = DocxTemplate("SARAVANA_fixed.docx")
        doc.render(context)

        docx_file = os.path.join("/tmp", f"Invoice_{invoice_no}.docx")
        doc.save(docx_file)

        pdf_file = os.path.join("/tmp", f"Invoice_{invoice_no}.pdf")
        convert(docx_file, pdf_file)

        return jsonify({"success": True, "download_url": f"/download/{os.path.basename(pdf_file)}"})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/download/<filename>")
def download(filename):
    try:
        file_path = os.path.join("/tmp", filename)
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")
