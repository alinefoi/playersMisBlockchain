import React, { useState, useEffect } from 'react';
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import { example_backend } from 'declarations/example_backend';
import './index.scss';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [players, setPlayers] = useState([]);
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false); // State to control the visibility of the player list
  const [showEditPlayerForm, setShowEditPlayerForm] = useState(false); // State to control the visibility of the edit player form
  const [newPlayer, setNewPlayer] = useState({ firstName: '', lastName: '', team: '' });
  const [editPlayer, setEditPlayer] = useState({ id: null, firstName: '', lastName: '', team: '' });

  const authClientPromise = AuthClient.create();

  const signIn = async () => {
    const authClient = await authClientPromise;
    const internetIdentityUrl = process.env.NODE_ENV === 'production'
      ? undefined
      : `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`;

    await new Promise((resolve) => {
      authClient.login({
        identityProvider: internetIdentityUrl,
        onSuccess: () => resolve(undefined),
      });
    });

    const identity = authClient.getIdentity();
    updateIdentity(identity);
    setIsLoggedIn(true);
  };

  const signOut = async () => {
    const authClient = await authClientPromise;
    await authClient.logout();
    updateIdentity(null);
  };

  const updateIdentity = (identity) => {
    if (identity) {
      setPrincipal(identity.getPrincipal());
      // Create Actor with HttpAgent
      const agent = new HttpAgent();
      const actor = Actor.createActor(example_backend, { agent: agent });
      example_backend.setActor(actor); // Set the actor for example_backend
    } else {
      setPrincipal(null);
      example_backend.setActor(null); // Clear the actor
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const authClient = await authClientPromise;
      const isAuthenticated = await authClient.isAuthenticated();
      setIsLoggedIn(isAuthenticated);
      if (isAuthenticated) {
        const identity = authClient.getIdentity();
        updateIdentity(identity);
      }
    };

    checkLoginStatus();
  }, []);

  const fetchPlayers = async () => {
    try {
      const playersList = await example_backend.getPlayers();
      console.log("Fetched players:", playersList);
      setPlayers(playersList);
      setShowPlayerList(true); // Show the player list after fetching
    } catch (error) {
      console.error("Failed to fetch players:", error);
    }
  };

  const handleAddPlayer = async (event) => {
    event.preventDefault();
    console.log("Submitting player:", newPlayer);

    try {
      await example_backend.addPlayer(newPlayer.firstName, newPlayer.lastName, newPlayer.team);
      console.log("Player added successfully");
      setNewPlayer({ firstName: '', lastName: '', team: '' });
      setShowAddPlayerForm(false);
      fetchPlayers(); // Fetch players after adding a new player
    } catch (error) {
      console.error("Failed to add player:", error);
    }
  };

  const handleEditPlayer = async (event) => {
    event.preventDefault();
    console.log("Editing player:", editPlayer);

    try {
      await example_backend.editPlayer(editPlayer.id, editPlayer.firstName, editPlayer.lastName, editPlayer.team);
      console.log("Player edited successfully");
      setEditPlayer({ id: null, firstName: '', lastName: '', team: '' });
      setShowEditPlayerForm(false);
      fetchPlayers(); // Fetch players after editing a player
    } catch (error) {
      console.error("Failed to edit player:", error);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    try {
      await example_backend.deletePlayer(playerId);
      console.log("Player deleted successfully");
      fetchPlayers(); // Fetch players after deleting a player
    } catch (error) {
      console.error("Failed to delete player:", error);
    }
  };

  const handleViewPlayers = () => {
    fetchPlayers();
    setShowAddPlayerForm(false); // Close the add player form when fetching players
  };

  const handleShowEditForm = (player) => {
    setEditPlayer(player);
    setShowEditPlayerForm(true);
  };

  return (
    <main>
      <h1>PLAYERS MANAGEMENT SYSTEM</h1>
      {isLoggedIn ? (
        <>
          <p>Welcome back, {principal ? principal.toString() : "User"}!</p>
          <button onClick={signOut}>Sign Out</button>
          <button onClick={() => setShowAddPlayerForm(true)}>Add New Player</button>
          <button onClick={handleViewPlayers}>View Players</button>
          {showPlayerList && ( // Conditionally render the player list
            <>
              <h2>Player List</h2>
              <ul>
                {players.map((player, index) => (
                  <li key={index}>
                    {player.firstName} {player.lastName} - {player.team}
                    <button onClick={() => handleShowEditForm(player)}>Edit</button>
                    <button onClick={() => handleDeletePlayer(player.id)}>Delete</button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {showAddPlayerForm && (
            <form onSubmit={handleAddPlayer}>
              <label>
                First Name:
                <input
                  type="text"
                  value={newPlayer.firstName}
                  onChange={(e) => setNewPlayer({ ...newPlayer, firstName: e.target.value })}
                  required
                />
              </label>
              <label>
                Last Name:
                <input
                  type="text"
                  value={newPlayer.lastName}
                  onChange={(e) => setNewPlayer({ ...newPlayer, lastName: e.target.value })}
                  required
                />
              </label>
              <label>
                Team:
                <input
                  type="text"
                  value={newPlayer.team}
                  onChange={(e) => setNewPlayer({ ...newPlayer, team: e.target.value })}
                  required
                />
              </label>
              <button type="submit">Save Player</button>
            </form>
          )}
          {showEditPlayerForm && (
            <form onSubmit={handleEditPlayer}>
              <label>
                First Name:
                <input
                  type="text"
                  value={editPlayer.firstName}
                  onChange={(e) => setEditPlayer({ ...editPlayer, firstName: e.target.value })}
                  required
                />
              </label>
              <label>
                Last Name:
                <input
                  type="text"
                  value={editPlayer.lastName}
                  onChange={(e) => setEditPlayer({ ...editPlayer, lastName: e.target.value })}
                  required
                />
              </label>
              <label>
                Team:
                <input
                  type="text"
                  value={editPlayer.team}
                  onChange={(e) => setEditPlayer({ ...editPlayer, team: e.target.value })}
                  required
                />
              </label>
              <button type="submit">Save Changes</button>
            </form>
          )}
        </>
      ) : (
        <button onClick={signIn}>Sign In</button>
      )}
    </main>
  );
}

export default App;
