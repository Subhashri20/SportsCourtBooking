
const API = window.location.origin;

const $ = (id) => document.getElementById(id);

let facilities = [];
let selectedSlot = null;
let toastTimer;

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function showToast(message, isError = false) {
    const toast = $("toast");
    toast.textContent = message;
    toast.className = isError ? "show error" : "show";

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.className = "";
    }, 4500);
}

async function request(path, options = {}) {
    let response;

    try {
        response = await fetch(API + path, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
    } catch (error) {
        throw new Error(
            "Cannot connect to the server. Check that Spring Boot is running."
        );
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.detail ||
            data?.message ||
            data?.error ||
            `Request failed (HTTP ${response.status})`
        );
    }

    return data;
}

function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function sportIcon(type) {
    const sport = (type || "").toLowerCase();

    if (sport.includes("badminton")) return "🏸";
    if (sport.includes("basketball")) return "🏀";
    if (sport.includes("football")) return "⚽";
    if (sport.includes("cricket")) return "🏏";
    if (sport.includes("tennis")) return "🎾";
    if (sport.includes("volleyball")) return "🏐";
    if (sport.includes("swim")) return "🏊";

    return "🏆";
}

function resetSlots() {
    selectedSlot = null;
    $("confirmBooking").disabled = true;
    $("selectedSlot").textContent = "No slot selected.";
    $("slots").innerHTML =
        '<p class="helper">Click Check Availability to load time slots.</p>';
}

/* =========================
   FACILITY CRUD - READ
========================= */
async function loadFacilities() {
    const facilityList = $("facilityList");

    facilityList.innerHTML =
        '<p class="helper">Loading facilities...</p>';

    try {
        const result = await request("/facilities");
        facilities = Array.isArray(result) ? result : [];

        $("facilityCount").textContent = facilities.length;

        $("facilitySelect").innerHTML =
            '<option value="">Select a facility</option>' +
            facilities.map(f =>
                `<option value="${Number(f.facilityId)}">
          ${escapeHTML(f.facilityName)}
        </option>`
            ).join("");

        if (!facilities.length) {
            facilityList.innerHTML =
                '<p class="helper">No facilities found. Add your first facility using the form below.</p>';
            return;
        }

        facilityList.innerHTML = facilities.map(f => {
            const available = f.status === "AVAILABLE";

            return `
        <article class="facility-card">
          <div class="facility-art">${sportIcon(f.sportType)}</div>

          <div class="facility-body">
            <span class="status ${available ? "" : "maintenance"}">
              ${available ? "● AVAILABLE" : "● MAINTENANCE"}
            </span>

            <h3>${escapeHTML(f.facilityName)}</h3>

            <p>
              Sport: ${escapeHTML(f.sportType)}<br>
              Location: ${escapeHTML(f.location || "Campus")}<br>
              Opening: ${escapeHTML(f.openingTime || "—")}<br>
              Closing: ${escapeHTML(f.closingTime || "—")}
            </p>

            <div class="facility-actions">
              <button
                class="primary-btn choose-facility"
                type="button"
                data-id="${Number(f.facilityId)}"
                ${available ? "" : "disabled"}>
                ${available ? "Book This Court →" : "Unavailable"}
              </button>

              <button
                class="secondary-btn edit-facility"
                type="button"
                data-id="${Number(f.facilityId)}">
                Edit
              </button>

              <button
                class="danger-btn delete-facility"
                type="button"
                data-id="${Number(f.facilityId)}">
                Delete
              </button>
            </div>
          </div>
        </article>
      `;
        }).join("");

    } catch (error) {
        facilityList.innerHTML =
            `<p class="helper">Could not load facilities: ${escapeHTML(error.message)}</p>`;
        showToast(error.message, true);
        console.error("loadFacilities error:", error);
    }
}

/* =========================
   DASHBOARD STATISTICS
========================= */
async function loadStats() {
    try {
        const [students, bookings] = await Promise.all([
            request("/students"),
            request("/bookings")
        ]);

        $("studentCount").textContent =
            Array.isArray(students) ? students.length : 0;

        $("bookingCount").textContent =
            Array.isArray(bookings) ? bookings.length : 0;

    } catch (error) {
        console.error("Dashboard statistics:", error.message);
    }
}

/* =========================
   FACILITY CRUD - CREATE
========================= */
const facilityForm = $("facilityForm");

function clearFacilityForm() {
    facilityForm.reset();
    $("facilityId").value = "";
    $("facilityFormTitle").textContent = "Add sports facility";
    $("saveFacilityBtn").textContent = "＋ Add facility";
    $("openingTime").value = "06:00";
    $("closingTime").value = "21:00";
    $("facilityStatus").value = "AVAILABLE";
}

$("resetFacilityBtn").addEventListener("click", clearFacilityForm);

facilityForm.addEventListener("submit", async event => {
    event.preventDefault();

    const id = $("facilityId").value;

    const facility = {
        facilityName: $("facilityName").value.trim(),
        sportType: $("sportType").value.trim(),
        location: $("facilityLocation").value.trim(),
        openingTime: $("openingTime").value,
        closingTime: $("closingTime").value,
        status: $("facilityStatus").value
    };

    if (!facility.facilityName || !facility.sportType ||
        !facility.location || !facility.openingTime ||
        !facility.closingTime) {
        showToast("Please fill all facility fields.", true);
        return;
    }

    if (facility.openingTime >= facility.closingTime) {
        showToast("Closing time must be after opening time.", true);
        return;
    }

    const saveButton = $("saveFacilityBtn");
    saveButton.disabled = true;

    try {
        await request(
            id ? `/facilities/${id}` : "/facilities",
            {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(facility)
            }
        );

        showToast(
            id ? "Facility updated successfully!" : "Facility added successfully!"
        );

        clearFacilityForm();
        await loadFacilities();
        await loadStats();

    } catch (error) {
        showToast(error.message, true);
        console.error("Facility save error:", error);
    } finally {
        saveButton.disabled = false;
    }
});

/* =========================
   FACILITY CRUD - UPDATE
========================= */
$("facilityList").addEventListener("click", event => {
    const button = event.target.closest(".edit-facility");
    if (!button) return;

    const facility = facilities.find(
        item => Number(item.facilityId) === Number(button.dataset.id)
    );

    if (!facility) {
        showToast("Facility not found. Refresh and try again.", true);
        return;
    }

    $("facilityId").value = facility.facilityId;
    $("facilityName").value = facility.facilityName || "";
    $("sportType").value = facility.sportType || "";
    $("facilityLocation").value = facility.location || "";
    $("openingTime").value = (facility.openingTime || "06:00").slice(0, 5);
    $("closingTime").value = (facility.closingTime || "21:00").slice(0, 5);
    $("facilityStatus").value = facility.status || "AVAILABLE";

    $("facilityFormTitle").textContent = "Edit sports facility";
    $("saveFacilityBtn").textContent = "Update facility";

    $("facilityForm").scrollIntoView({ behavior: "smooth" });
});

/* =========================
   FACILITY CRUD - DELETE
   Requires DELETE /facilities/{id}
========================= */
$("facilityList").addEventListener("click", async event => {
    const button = event.target.closest(".delete-facility");
    if (!button) return;

    const id = Number(button.dataset.id);

    const facility = facilities.find(
        item => Number(item.facilityId) === id
    );

    const confirmed = confirm(
        `Delete ${facility?.facilityName || "this facility"}? This cannot be undone.`
    );

    if (!confirmed) return;

    button.disabled = true;

    try {
        await request(`/facilities/${id}`, {
            method: "DELETE"
        });

        showToast("Facility deleted successfully.");

        if (Number($("facilityId").value) === id) {
            clearFacilityForm();
        }

        await loadFacilities();
        await loadStats();
        resetSlots();

    } catch (error) {
        showToast(
            error.message +
            " If existing bookings use this facility, handle those records first.",
            true
        );
        button.disabled = false;
    }
});

/* =========================
   CHOOSE FACILITY FOR BOOKING
========================= */
$("facilityList").addEventListener("click", event => {
    const button = event.target.closest(".choose-facility");
    if (!button) return;

    $("facilitySelect").value = button.dataset.id;
    resetSlots();

    $("booking").scrollIntoView({ behavior: "smooth" });
});

$("facilitySelect").addEventListener("change", resetSlots);
$("bookingDate").addEventListener("change", resetSlots);

/* =========================
   STUDENT REGISTRATION
========================= */
$("studentForm").addEventListener("submit", async event => {
    event.preventDefault();

    const student = {
        studentName: $("studentName").value.trim(),
        email: $("studentEmail").value.trim(),
        contactInfo: $("studentContact").value.trim()
    };

    try {
        const result = await request("/students", {
            method: "POST",
            body: JSON.stringify(student)
        });

        $("bookingStudentId").value = result.studentId;
        $("historyStudentId").value = result.studentId;

        $("studentInfo").textContent =
            `Registration successful! Your Student ID is ${result.studentId}.`;

        $("studentForm").reset();

        showToast(
            `Student registered successfully! ID: ${result.studentId}`
        );

        await loadStats();

    } catch (error) {
        showToast(error.message, true);
    }
});

/* =========================
   CHECK AVAILABLE TIME SLOTS
========================= */
$("checkSlots").addEventListener("click", async () => {
    const facilityId = $("facilitySelect").value;
    const date = $("bookingDate").value;

    resetSlots();

    if (!facilityId || !date) {
        showToast("Please select a facility and booking date.", true);
        return;
    }

    $("slots").textContent = "Checking available slots...";

    try {
        const slots = await request(
            `/bookings/available/${facilityId}?date=${encodeURIComponent(date)}`
        );

        if (!Array.isArray(slots) || !slots.length) {
            $("slots").innerHTML =
                '<p class="helper">No hourly slots found for this facility.</p>';
            return;
        }

        $("slots").innerHTML = slots.map((slot, index) => `
      <button
        class="slot"
        type="button"
        data-index="${index}"
        ${slot.available ? "" : "disabled"}>
        ${escapeHTML((slot.startTime || "").slice(0, 5))}
        -
        ${escapeHTML((slot.endTime || "").slice(0, 5))}
        ${slot.available ? "" : " · Booked / Unavailable"}
      </button>
    `).join("");

        $("slots").querySelectorAll(".slot").forEach(button => {
            button.addEventListener("click", () => {
                const slot = slots[Number(button.dataset.index)];

                if (!slot.available) return;

                selectedSlot = slot;

                $("slots").querySelectorAll(".slot").forEach(item => {
                    item.classList.remove("selected");
                });

                button.classList.add("selected");

                $("selectedSlot").textContent =
                    `Selected: ${slot.startTime} - ${slot.endTime}`;

                $("confirmBooking").disabled = false;
            });
        });

    } catch (error) {
        $("slots").textContent = error.message;
        showToast(error.message, true);
    }
});

/* =========================
   CONFIRM COURT BOOKING
========================= */
$("confirmBooking").addEventListener("click", async () => {
    const studentId = Number($("bookingStudentId").value);
    const facilityId = Number($("facilitySelect").value);
    const bookingDate = $("bookingDate").value;

    if (!studentId || !facilityId || !bookingDate || !selectedSlot) {
        showToast(
            "Enter your student ID and select an available slot.",
            true
        );
        return;
    }

    const booking = {
        studentId,
        facilityId,
        bookingDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
    };

    $("confirmBooking").disabled = true;

    try {
        const result = await request("/bookings", {
            method: "POST",
            body: JSON.stringify(booking)
        });

        showToast(
            `Booking #${result.bookingId} confirmed successfully!`
        );

        $("historyStudentId").value = studentId;

        resetSlots();
        await loadStats();
        await loadHistory();

    } catch (error) {
        showToast(error.message, true);
        $("confirmBooking").disabled = false;
    }
});

/* =========================
   BOOKING HISTORY
========================= */
async function loadHistory() {
    const studentId = Number($("historyStudentId").value);

    if (!studentId) {
        showToast("Please enter a valid Student ID.", true);
        return;
    }

    $("bookingHistory").textContent = "Loading bookings...";

    try {
        const bookings = await request(
            `/bookings/student/${studentId}`
        );

        if (!Array.isArray(bookings) || !bookings.length) {
            $("bookingHistory").innerHTML =
                '<p class="helper">No bookings found for this student.</p>';
            return;
        }

        $("bookingHistory").innerHTML = bookings.map(booking => {
            const startTime = booking.startTime || "00:00";
            const canCancel =
                booking.status === "CONFIRMED" &&
                new Date(`${booking.bookingDate}T${startTime}`) > new Date();

            return `
        <div class="booking-item">
          <div>
            <h3>
              ${sportIcon(booking.facility?.sportType)}
              ${escapeHTML(booking.facility?.facilityName || "Sports Facility")}
            </h3>

            <p>Booking ID: #${Number(booking.bookingId)}</p>
            <p>📅 ${escapeHTML(booking.bookingDate)}</p>
            <p>
              🕒 ${escapeHTML(booking.startTime)} -
              ${escapeHTML(booking.endTime)}
            </p>
            <p>Status: <strong>${escapeHTML(booking.status)}</strong></p>
          </div>

          ${canCancel ? `
            <button
              class="cancel-btn"
              data-booking-id="${Number(booking.bookingId)}">
              Cancel Booking
            </button>
          ` : ""}
        </div>
      `;
        }).join("");

    } catch (error) {
        $("bookingHistory").textContent = error.message;
        showToast(error.message, true);
    }
}

$("loadHistory").addEventListener("click", loadHistory);

/* =========================
   CANCEL BOOKING
========================= */
$("bookingHistory").addEventListener("click", async event => {
    const button = event.target.closest(".cancel-btn");
    if (!button) return;

    const bookingId = Number(button.dataset.bookingId);

    if (!confirm(`Cancel booking #${bookingId}?`)) return;

    button.disabled = true;

    try {
        await request(`/bookings/${bookingId}/cancel`, {
            method: "PUT"
        });

        showToast(`Booking #${bookingId} cancelled successfully.`);

        await loadHistory();
        await loadStats();

    } catch (error) {
        showToast(error.message, true);
        button.disabled = false;
    }
});

/* =========================
   SIDEBAR ACTIVE LINK
========================= */
document.querySelectorAll(".side-nav a").forEach(link => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".side-nav a").forEach(item => {
            item.classList.remove("active");
        });

        link.classList.add("active");
    });
});

/* =========================
   INITIAL PAGE LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const today = localDateString(new Date());

    $("bookingDate").min = today;
    $("bookingDate").value = today;

    loadFacilities();
    loadStats();
});
