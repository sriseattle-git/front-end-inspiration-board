import React, { useState, useEffect } from 'react';
import './App.css';
import Boards from './components/boards'
import CardList from './components/cardlist'
import NewBoardForm from './components/newboardform'
import NewCardForm from './components/newcardform'
import axios from 'axios'

const boardURL = 'http://127.0.0.1:5000/boards';
const cardURL = 'http://127.0.0.1:5000/cards';

function App() {
  const [boardData, setBoardData] = useState([]);

  const [selectedBoard, setSelectedBoard] = useState({
    id: undefined,
    title: ""
  });

  const [cardData, setCardData] = useState([]);

  const NEWBOARDFORMBUTTONSHOWVALUE= "Show New Board Form";
  const NEWBOARDFORMBUTTONHIDEVALUE = "Hide New Board Form";
  const [showNewBoardForm, setShowNewBoardForm] = useState({
    state: false,
    value: NEWBOARDFORMBUTTONSHOWVALUE
  });

  const getAllBoards = () => {
    return( 
      axios.get(`${boardURL}`)
      .then((response) => {
        console.log("Successful get boards API response received");
        return (convertBoardData(response.data)); })
      .catch((e) => { console.log(e); })
    );
  };
  
  const convertBoardData = (data) => {
    const boardList = [];
  
    // Repopulate newly loaded board data with prior selection status, if one exists
    for (let board of data) {
      let newBoard = {
        id: board.id,
        title: board.title,
        owner: board.owner,
        isSelected: (selectedBoard.id === board.id) ? true : false
      };
      boardList.push(newBoard);
    }
    return boardList;
  }

  const getCardsForBoard = (boardId) => {
    return( 
      axios.get(`${boardURL}/${boardId}/cards`)
      .then((response) => {
        console.log("Successful get cards API response received");
        return (convertCardData(response.data)); })
      .catch((e) => { console.log(e); })
    );
  };
  
  const convertCardData = (data) => {
    const cardList = [];
  
    for (let card of data) {
      let newCard = {
        id: card.id,
        message: card.message,
        likes: card.likes_count,
      };
      cardList.push(newCard);
    }
  
    return cardList;  
  }
    
  useEffect( () => {
    getAllBoards().then((boardList) => setBoardData(boardList));
    console.log("After getAllBoards");
  }, []);

  const updateBoardSelection = (boardSelected) => {
    const boards = boardData.map((board) => {
      if (board.id === boardSelected.id) {
        return boardSelected;
      }
      else {
        // Reset selection status for all other boards
        board.isSelected = false;
        return board;
      }
    });

    setBoardData(boards);
    setSelectedBoard({id: boardSelected.id, title: boardSelected.title});    
    fetchCards(boardSelected);
  };

  const addNewBoardAPI = (newBoard) => {
    axios.post(`${boardURL}`, newBoard)
    .then((response) => {
      console.log("Post board API call succeeded");
      // Retrieve updated list of board and update app state
      getAllBoards().then((boardList) => setBoardData(boardList));
    })
    .catch((e) => console.log("Post card call failed", e));        
  }
  const addNewBoard = (newBoard) => {
    addNewBoardAPI(newBoard);

    // Hide the create new board form - must be visible to create, so toggle will hide it
    toggleNewBoardFormVisibility();
  };

  const fetchCards = (selectedBoard) => {
    getCardsForBoard(selectedBoard.id).then((cardList) => setCardData(cardList));
    console.log("After getCardsForBoard");
  };

  const updateCardAPI = (updatedCard) => {
    axios.patch(`${cardURL}/${updatedCard.id}`)
    .then((response) => {
      console.log("Patch card API call succeeded");
    })
    .catch((e) => console.log("Patch card call failed", e));
  }
  
  const updateCard = (updatedCard) => {
    const cards = cardData.map((card) => {
      if (card.id === updatedCard.id) {
        return updatedCard;
      } else {
        return card;
      }
    });

    updateCardAPI(updatedCard);
    setCardData(cards);
  };

  const deleteCardAPI = (deletedCard) => {
    axios.delete(`${cardURL}/${deletedCard.id}`)
    .then((response) => {
      console.log("Delete card API call succeeded");
      // Retrieve list of cards for the board and update its state in the app 
      return(getCardsForBoard(selectedBoard.id).then((cardList) => setCardData(cardList)));      
    })
    .catch((e) => console.log("Delete card call failed", e));    
  }

  const deleteCard = (cardToDelete) => {
    // Leaving code below for reference on how to filter - not needed anymore
    const cards = cardData.filter((card) => (card.id !== cardToDelete.id));
    
    // API call to delete card also refreshes list of cards
    deleteCardAPI(cardToDelete);
  };

  const postNewCardAPI = (newCard, boardId) => {
    let postReq = {
      message: newCard.message
    };

    axios.post(`${boardURL}/${boardId}/cards`, postReq)
    .then((response) => {
      console.log("Post card API call succeeded");
      return(getCardsForBoard(boardId).then((cardList) => setCardData(cardList)));
    })
    .catch((e) => console.log("Post card call failed", e));    
  }

  const addNewCard = (newCardMsg) => {
    // Generated id is going to be ignored by the API, but keeping it here for future reference
    const nextId = Math.max(...cardData.map(card => card.id)) + 1;
    let newCard = {
      id: nextId,
      message: newCardMsg,
      likes: 0
    }

    postNewCardAPI(newCard, selectedBoard.id);
  };

  const toggleNewBoardFormVisibility = () => {
    let newState = !showNewBoardForm.state;
    let newValue;

    if (newState)
      newValue = NEWBOARDFORMBUTTONHIDEVALUE;
    else
      newValue = NEWBOARDFORMBUTTONSHOWVALUE;

    setShowNewBoardForm({
      state: newState,
      value: newValue
    });
  }

  const onNewBoardShowButtonClick = () => {
    toggleNewBoardFormVisibility();
  }

  return(
    <div className='page__container'>
      <div className='content__container'>
        <h1>Inspiration Board</h1>
        <section className='boards__container'>
          <Boards 
            boards={boardData}
            onBoardSelection={updateBoardSelection} />
          <section className='new-card-form__container'>
            <h2>New Card</h2>
            <NewCardForm onCreateCard={addNewCard}/>
          </section>                
          <section className='new-board-form__container'>
            <h2>Create a New Board</h2>
            {showNewBoardForm.state && 
              <NewBoardForm onCreateBoard={addNewBoard} />
            }
            <span className='new-board-form__toggle-btn' onClick={onNewBoardShowButtonClick}>{showNewBoardForm.value}</span>
          </section>
          {(selectedBoard.id === undefined) && <h3>Select a Board Please</h3>}      
        </section>
        {(selectedBoard.id !== undefined) && 
          <section className='cards__container'>
            <CardList 
              boardName={selectedBoard.title}
              cards={cardData}
              onUpdateCard={updateCard}
              onDeleteCard={deleteCard}
            />
          </section>
        }
      </div>
    </div>
  )
}

/* DEFAULT React App() function & import
import logo from './logo.svg';
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}
*/

export default App;
