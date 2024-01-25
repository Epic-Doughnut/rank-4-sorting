let itemList = [];

function printList() {
    const inputElement = document.getElementById('itemInput');
    const lines = inputElement.value.split('\n');

    // Append new items to the existing itemList
    lines.forEach(line => {
        const itemName = line.trim();
        if (itemName && !itemList.some(item => item.name === itemName)) {
            // If the item is not already in the list, add it with a default Elo score
            itemList.push({ name: itemName, elo: 1200 });
        }
    });

    localStorage.setItem('itemList', JSON.stringify(itemList));

    updateSidebar(itemList);
    console.log("List:", itemList);
}

function updateSidebar(itemList) {
    const sidebarElement = document.getElementById('sidebar');
    sidebarElement.innerHTML = "<h2>Your Ranking</h2>";

    itemList.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.textContent = `[${item.elo.toFixed(0)}] ${item.name}`;
        sidebarElement.appendChild(itemDiv);
    });
}

// Load the initial sidebar content when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const storedItemList = localStorage.getItem('itemList');
    if (storedItemList) {
        const parsedItemList = JSON.parse(storedItemList);
        updateSidebar(parsedItemList);
    }
});

function clearList() {
    if (!confirm('Are you sure you want to clear the list? This cannot be undone.')) return;

    // Clear the list from localStorage
    localStorage.removeItem('itemList');

    // Update the sidebar to reflect the empty list
    updateSidebar([]);
}

function startRanking() {
    const mainContainer = document.getElementById('mainContainer');
    const rankingContainer = document.getElementById('rankingContainer');
    const rankingList = document.getElementById('rankingList');

    // Show the ranking container and hide the main container
    mainContainer.style.display = 'none';
    rankingContainer.style.display = 'block';

    // Get four random items from the itemList for ranking
    itemList = JSON.parse(localStorage.getItem('itemList'));
    const itemsForRanking = getRandomItems(itemList, 4);

    // Display the items in the ranking list
    itemsForRanking.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = item.name;
        listItem.setAttribute('draggable', true);
        rankingList.appendChild(listItem);
    });

    // Make the list items draggable
    makeListSortable();
}

function makeListSortable() {
    const rankingList = document.getElementById('rankingList');

    // Initialize the sortable library (sortable.js)
    new Sortable(rankingList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onUpdate: () => {
            // This function is called when the user finishes dragging an item
            console.log("List updated:", getRankingOrder());
        }
    });
}

function getRankingOrder() {
    // Get the current order of items in the ranking list
    const rankingList = document.getElementById('rankingList');
    return Array.from(rankingList.children).map(li => li.textContent);
}


function getRandomItems(array, count) {
    // Function to get a random subset of items from the array
    const shuffledArray = array.slice().sort(() => Math.random() - 0.5);
    return shuffledArray.slice(0, count);
}

function submitRanking() {
    const rankingContainer = document.getElementById('rankingContainer');
    const mainContainer = document.getElementById('mainContainer');
    const rankingList = document.getElementById('rankingList');

    // Hide the ranking container and show the main container
    mainContainer.style.display = 'block';
    rankingContainer.style.display = 'none';

    // Get the user's ranking and update the scores using Elo system
    const userRanking = getRankingOrder();
    updateEloScores(userRanking);

    // Resort the list
    itemList.sort((a, b) => b.elo - a.elo);

    // Update the localStorage with the updated itemList
    localStorage.setItem('itemList', JSON.stringify(itemList));

    // Update the sidebar to reflect the changes
    updateSidebar(itemList);

    rankingList.innerHTML = '';
}

function getRankingOrder() {
    // Get the current order of items in the ranking list
    const rankingList = document.getElementById('rankingList');
    return Array.from(rankingList.children).map(li => li.textContent);
}

function updateEloScores(userRanking) {

    // Elo system constants
    const K = 32; // Adjust this value based on desired sensitivity

    // Calculate expected win probability
    const expectedWinProbability = (elo1, elo2) => 1 / (1 + 10 ** ((elo2 - elo1) / 400));

    const eloChanges = [];

    // Iterate over the ranked items
    for (let i = 0; i < userRanking.length; i++) {
        const currentItem = itemList.find(item => item.name === userRanking[i]);
        const previousElo = currentItem.elo;

        // Update Elo scores only for the current item and the items ranked below it
        for (let j = i + 1; j < userRanking.length; j++) {
            const opponentItem = itemList.find(item => item.name === userRanking[j]);

            const expectedCurrent = expectedWinProbability(currentItem.elo, opponentItem.elo);
            const expectedOpponent = expectedWinProbability(opponentItem.elo, currentItem.elo);

            const actualCurrent = i < j ? 1 : 0; // 1 indicates the current item won, 0 indicates the opponent won
            const actualOpponent = i < j ? 0 : 1;

            // Update Elo scores
            currentItem.elo += K * (actualCurrent - expectedCurrent);
            opponentItem.elo += K * (actualOpponent - expectedOpponent);
        }

        // Save the new Elo score for the current item
        const newElo = currentItem.elo;
        eloChanges.push({ name: currentItem.name, previousElo, newElo });

    }

    console.log("New Elo Scores (Ranked Items):", eloChanges);
}

function copyToClipboard() {
    const sidebarContent = document.getElementById('sidebar').innerText;

    // Create a textarea element to temporarily hold the text
    const textarea = document.createElement('textarea');
    textarea.value = sidebarContent;

    // Append the textarea to the document
    document.body.appendChild(textarea);

    // Select the text in the textarea
    textarea.select();

    // Copy the selected text to the clipboard
    document.execCommand('copy');

    // Remove the textarea from the document
    document.body.removeChild(textarea);

    // Alert the user that the content has been copied
    alert('Content copied to clipboard!');
}
