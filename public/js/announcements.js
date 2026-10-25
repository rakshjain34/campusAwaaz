document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("announcementSearch");
    const sortSelect = document.getElementById("announcementSort");
    const categoryContainer = document.getElementById("announcementCategories");
    const feed = document.getElementById("announcementFeed");
    const visibleCount = document.getElementById("announcementVisibleCount");
    const emptyState = document.getElementById("announcementEmptyState");
    const noResults = document.getElementById("announcementNoResults");
    const resetButton = document.getElementById("announcementReset");
    const characterInput = document.getElementById("announcementContent") || document.getElementById("description");
    const characterCount = document.getElementById("announcementCharacterCount");
    const announcementForm = document.getElementById("announcementForm");
    const audienceCheckboxes = Array.from(document.querySelectorAll(".audience-checkbox"));
    const audienceEveryone = document.getElementById("audienceEveryone");
    const audienceStudents = document.getElementById("audienceStudents");
    const audienceStaff = document.getElementById("audienceStaff");
    const studentAudienceGroup = document.getElementById("studentAudienceGroup");
    const staffAudienceGroup = document.getElementById("staffAudienceGroup");
    const audienceError = document.getElementById("audienceError");
    const studentAudienceError = document.getElementById("studentAudienceError");
    const staffAudienceCheckboxes = Array.from(document.querySelectorAll('input[name="announcement[staffAudience]"]'));
    const staffAll = document.getElementById("staffAll");
    const staffWardens = document.getElementById("staffWardens");
    const activeCategoryButtons = categoryContainer ? Array.from(categoryContainer.querySelectorAll("[data-category]")) : [];
    let activeCategory = "all";
    const cards = Array.from(document.querySelectorAll(".announcement-card, .announcement-list-card"));

    function updateAnnouncements() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const sortValue = sortSelect ? sortSelect.value : "newest";
        const filteredCards = cards.filter(card => {
            const text = card.textContent.toLowerCase();
            const category = (card.dataset.category || "").toLowerCase();
            const matchesSearch = !query || text.includes(query);
            const matchesCategory = activeCategory === "all" || category === activeCategory.toLowerCase();
            return matchesSearch && matchesCategory;
        });

        cards.forEach(card => {
            card.style.display = filteredCards.includes(card) ? "" : "none";
        });

        if (feed && sortValue !== "newest") {
            const sortedCards = [...filteredCards];

            if (sortValue === "oldest") {
                sortedCards.reverse();
            }

            if (sortValue === "title") {
                sortedCards.sort((a, b) => {
                    const titleA = a.querySelector("h1, h2, h3, h4")?.textContent.trim().toLowerCase() || "";
                    const titleB = b.querySelector("h1, h2, h3, h4")?.textContent.trim().toLowerCase() || "";
                    return titleA.localeCompare(titleB);
                });
            }

            sortedCards.forEach(card => feed.appendChild(card));
        }

        if (visibleCount) {
            visibleCount.textContent = filteredCards.length;
        }

        if (emptyState) {
            emptyState.style.display = cards.length === 0 ? "" : "none";
        }

        if (noResults) {
            noResults.style.display = cards.length > 0 && filteredCards.length === 0 ? "" : "none";
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", updateAnnouncements);
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", updateAnnouncements);
    }

    activeCategoryButtons.forEach(button => {
        button.addEventListener("click", () => {
            activeCategory = button.dataset.category || "all";

            activeCategoryButtons.forEach(item => {
                item.classList.toggle("active", item === button);
                item.setAttribute("aria-pressed", item === button ? "true" : "false");
            });

            updateAnnouncements();
        });
    });

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
            }

            if (sortSelect) {
                sortSelect.value = "newest";
            }

            activeCategory = "all";

            activeCategoryButtons.forEach(button => {
                const isActive = button.dataset.category === "all";
                button.classList.toggle("active", isActive);
                button.setAttribute("aria-pressed", isActive ? "true" : "false");
            });

            updateAnnouncements();
        });
    }

    document.addEventListener("keydown", event => {
        const target = event.target;
        const isTyping = target instanceof HTMLElement && (
            target.matches("input, textarea, select") ||
            target.isContentEditable
        );

        if (event.key === "/" && searchInput && !isTyping) {
            event.preventDefault();
            searchInput.focus();
        }

        if (event.key === "Escape" && searchInput && document.activeElement === searchInput) {
            searchInput.value = "";
            searchInput.blur();
            updateAnnouncements();
        }
    });

    if (characterInput && characterCount) {
        const updateCharacterCount = () => {
            characterCount.textContent = characterInput.value.length;
        };

        characterInput.addEventListener("input", updateCharacterCount);
        updateCharacterCount();
    }

    function getCheckedAudienceTypes() {
        return audienceCheckboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
    }

    function updateAudienceFields(changedCheckbox) {
        if (!audienceEveryone || !audienceStudents || !audienceStaff) {
            return;
        }

        if (changedCheckbox === audienceEveryone && audienceEveryone.checked) {
            audienceStudents.checked = false;
            audienceStaff.checked = false;
        } else if (changedCheckbox === audienceStudents || changedCheckbox === audienceStaff) {
            if (audienceStudents.checked && audienceStaff.checked) {
                audienceEveryone.checked = true;
                audienceStudents.checked = false;
                audienceStaff.checked = false;
            } else {
                audienceEveryone.checked = false;
            }
        }

        const everyoneSelected = audienceEveryone.checked;
        const studentsSelected = audienceStudents.checked && !everyoneSelected;
        const staffSelected = audienceStaff.checked && !everyoneSelected;

        if (studentAudienceGroup) {
            studentAudienceGroup.hidden = !studentsSelected;
        }

        if (staffAudienceGroup) {
            staffAudienceGroup.hidden = !staffSelected;
        }

        if (audienceError) {
            audienceError.textContent = "";
            audienceError.style.display = "none";
        }

        if (!studentsSelected) {
            clearStudentAudienceErrors();
        }

        if (!staffSelected) {
            clearStaffAudienceError();
        }
    }

    function clearStudentAudienceErrors() {
        if (studentAudienceError) {
            studentAudienceError.textContent = "";
            studentAudienceError.style.display = "none";
        }

        document.querySelectorAll(".student-audience-invalid").forEach(element => {
            element.classList.remove("student-audience-invalid");
        });
    }

    function clearStaffAudienceError() {
        document.querySelectorAll(".staff-audience-invalid").forEach(element => {
            element.classList.remove("staff-audience-invalid");
        });
    }

    function validateStudentAudience() {
        const groups = [
            {
                all: document.getElementById("allBranches"),
                checkboxes: Array.from(document.querySelectorAll(".branch-checkbox")),
                label: "branch"
            },
            {
                all: document.getElementById("allYears"),
                checkboxes: Array.from(document.querySelectorAll(".year-checkbox")),
                label: "year"
            },
            {
                all: document.getElementById("allSections"),
                checkboxes: Array.from(document.querySelectorAll(".section-checkbox")),
                label: "section"
            }
        ];

        const missingGroups = groups.filter(group => {
            return !group.all?.checked && !group.checkboxes.some(checkbox => checkbox.checked);
        });

        groups.forEach(group => {
            const container = group.all?.closest(".audience-option-group") || group.all?.parentElement?.parentElement;

            if (container) {
                container.classList.toggle("student-audience-invalid", missingGroups.includes(group));
            }
        });

        if (studentAudienceError) {
            if (missingGroups.length > 0) {
                const labels = missingGroups.map(group => group.label);
                const readableLabels = labels.length === 1
                    ? labels[0]
                    : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;

                studentAudienceError.textContent = `Choose at least one ${readableLabels}, or select the corresponding All option.`;
                studentAudienceError.style.display = "block";
            } else {
                studentAudienceError.textContent = "";
                studentAudienceError.style.display = "none";
            }
        }

        return missingGroups.length === 0;
    }

    function validateStaffAudience() {
        const selected = staffAudienceCheckboxes.some(checkbox => checkbox.checked);
        const container = staffAll?.closest(".audience-option-group") || staffAll?.parentElement?.parentElement;

        if (container) {
            container.classList.toggle("staff-audience-invalid", !selected);
        }

        let errorElement = document.getElementById("staffAudienceError");

        if (!errorElement && staffAudienceGroup) {
            errorElement = document.createElement("p");
            errorElement.id = "staffAudienceError";
            errorElement.className = "audience-validation-error";
            staffAudienceGroup.appendChild(errorElement);
        }

        if (errorElement) {
            errorElement.textContent = selected ? "" : "Choose All Staff or Wardens.";
            errorElement.style.display = selected ? "none" : "block";
        }

        return selected;
    }

    audienceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => updateAudienceFields(checkbox));
    });

    function setupAllOption(allCheckboxId, childSelector) {
        const allCheckbox = document.getElementById(allCheckboxId);
        const childCheckboxes = Array.from(document.querySelectorAll(`.${childSelector}`));

        if (!allCheckbox) {
            return;
        }

        allCheckbox.addEventListener("change", () => {
            if (allCheckbox.checked) {
                childCheckboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
            }
        });

        childCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    allCheckbox.checked = false;
                }
            });
        });
    }

    setupAllOption("allBranches", "branch-checkbox");
    setupAllOption("allYears", "year-checkbox");
    setupAllOption("allSections", "section-checkbox");

    if (staffAll && staffWardens) {
        staffAll.addEventListener("change", () => {
            if (staffAll.checked) {
                staffWardens.checked = false;
            }
        });

        staffWardens.addEventListener("change", () => {
            if (staffWardens.checked) {
                staffAll.checked = false;
            }
        });
    }

    if (announcementForm) {
        announcementForm.addEventListener("submit", event => {
            const selectedAudiences = getCheckedAudienceTypes();
            const everyoneSelected = selectedAudiences.includes("Everyone");
            const studentsSelected = selectedAudiences.includes("Student") && !everyoneSelected;
            const staffSelected = selectedAudiences.includes("Staff") && !everyoneSelected;
            let isValid = true;

            if (selectedAudiences.length === 0) {
                isValid = false;

                if (audienceError) {
                    audienceError.textContent = "Select at least one audience.";
                    audienceError.style.display = "block";
                }
            } else if (audienceError) {
                audienceError.textContent = "";
                audienceError.style.display = "none";
            }

            if (studentsSelected && !validateStudentAudience()) {
                isValid = false;
            }

            if (staffSelected && !validateStaffAudience()) {
                isValid = false;
            }

            if (!isValid) {
                event.preventDefault();

                const firstInvalid = announcementForm.querySelector(
                    ".student-audience-invalid, .staff-audience-invalid, #audienceError"
                );

                firstInvalid?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }
        });
    }

    updateAudienceFields();
    updateAnnouncements();
});