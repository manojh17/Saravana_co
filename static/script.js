document.addEventListener('DOMContentLoaded', () => {
    const itemsBody = document.getElementById('itemsBody');
    const addItemBtn = document.getElementById('addItemBtn');
    const billingForm = document.getElementById('billingForm');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Add initial row
    addRow();

    addItemBtn.addEventListener('click', addRow);

    function addRow() {
        const tr = document.createElement('tr');
        tr.className = 'item-row';
        tr.innerHTML = `
            <td><input type="text" name="product" required placeholder="Product Name"></td>
            <td><input type="text" name="hsn" placeholder="HSN"></td>
            <td><input type="number" name="qty" required min="1" value="1" style="width: 80px"></td>
            <td><input type="number" name="rate" required min="0" step="any" placeholder="0.00" style="width: 120px"></td>
            <td>
                <button type="button" class="btn-icon delete-btn" title="Remove Item">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tr.querySelector('.delete-btn').addEventListener('click', () => {
            if (itemsBody.children.length > 1) {
                tr.remove();
            } else {
                alert("You need at least one item.");
            }
        });

        itemsBody.appendChild(tr);
    }

    billingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather Data
        const name = document.getElementById('name').value;
        const invoiceNo = document.getElementById('invoice_no').value;
        const mobile = document.getElementById('mobile').value;
        const address = document.getElementById('address').value;

        const items = [];
        document.querySelectorAll('.item-row').forEach(row => {
            items.push({
                name: row.querySelector('input[name="product"]').value,
                hsn: row.querySelector('input[name="hsn"]').value,
                qty: parseFloat(row.querySelector('input[name="qty"]').value) || 0,
                rate: parseFloat(row.querySelector('input[name="rate"]').value) || 0
            });
        });

        const payload = {
            name, invoice_no: invoiceNo, mobile, address, items
        };

        // Show Loading
        loadingOverlay.classList.add('active');

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                // Trigger download
                window.location.href = result.download_url;
            } else {
                alert("Error generating PDF: " + result.error);
            }
        } catch (error) {
            console.error(error);
            alert("Network error generating PDF.");
        } finally {
            // Hide Loading after a short delay to cover download start
            setTimeout(() => {
                loadingOverlay.classList.remove('active');
            }, 1000);
        }
    });
});
