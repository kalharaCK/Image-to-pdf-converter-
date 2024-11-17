document.addEventListener("DOMContentLoaded", () => {
    const uploadArea = document.getElementById("uploadArea");
    const imageInput = document.getElementById("imageInput");
    const uploadButton = document.getElementById("uploadButton");
    const convertBtn = document.getElementById("convertBtn");
    const imageList = document.getElementById("imageList");
    const status = document.getElementById("status");

    let files = [];

    // Trigger file input on button click
    uploadButton.addEventListener("click", () => {
        imageInput.click();
    });

    // Handle file input change
    imageInput.addEventListener("change", (event) => {
        handleFiles(event.target.files);
    });

    // Drag-and-drop functionality
    uploadArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (event) => {
        event.preventDefault();
        uploadArea.classList.remove("dragover");
        handleFiles(event.dataTransfer.files);
    });

    // Handle file selection
    function handleFiles(selectedFiles) {
        for (let file of selectedFiles) {
            if (file.type.startsWith("image/")) {
                files.push(file);
                renderFile(file);
            }
        }
    }

    // Render file in the list
    function renderFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            const li = document.createElement("li");
            li.setAttribute("draggable", true);

            li.innerHTML = `
                <img src="${reader.result}" alt="${file.name}">
                <span>${file.name}</span>
                <button class="remove-btn">Remove</button>
            `;

            // Drag and drop for reordering
            li.addEventListener("dragstart", () => li.classList.add("dragging"));
            li.addEventListener("dragend", () => li.classList.remove("dragging"));

            // Remove functionality
            li.querySelector(".remove-btn").addEventListener("click", () => {
                const index = [...imageList.children].indexOf(li);
                files.splice(index, 1);
                li.remove();
            });

            imageList.appendChild(li);
        };

        reader.readAsDataURL(file);
    }

    // Handle dragging and reordering
    imageList.addEventListener("dragover", (event) => {
        event.preventDefault();
        const draggingElement = document.querySelector(".dragging");
        const siblings = [...imageList.children].filter((child) => child !== draggingElement);
        const nextSibling = siblings.find((sibling) => event.clientY <= sibling.offsetTop + sibling.offsetHeight / 2);
        imageList.insertBefore(draggingElement, nextSibling);
    });

    // Convert to PDF
    convertBtn.addEventListener("click", async () => {
        if (files.length === 0) {
            status.textContent = "Please select at least one image.";
            return;
        }

        status.textContent = "Processing...";
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        for (let file of files) {
            const imageUrl = await readFileAsDataURL(file);
            const img = new Image();
            img.src = imageUrl;

            await new Promise((resolve) => {
                img.onload = () => {
                    const imgWidth = pdf.internal.pageSize.getWidth();
                    const imgHeight = (img.height / img.width) * imgWidth;

                    pdf.addImage(img, "JPEG", 0, 0, imgWidth, imgHeight);
                    pdf.addPage();
                    resolve();
                };
            });
        }

        pdf.deletePage(pdf.internal.getNumberOfPages()); // Remove the last empty page
        pdf.save("converted.pdf");
        status.textContent = "PDF created successfully!";
    });

    function readFileAsDataURL(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }
});
