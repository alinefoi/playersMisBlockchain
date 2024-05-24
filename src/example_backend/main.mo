import Array "mo:base/Array";

actor {
  type Player = {
    id: Nat;
    firstName: Text;
    lastName: Text;
    team: Text;
  };

  stable var players: [Player] = [];

  public shared func addPlayer(firstName: Text, lastName: Text, team: Text) : async () {
    let id = Array.size(players) + 1;
    let newPlayer = { id; firstName; lastName; team };
    players := Array.append(players, [newPlayer]);
  };

  public shared func getPlayers() : async [Player] {
    return players;
  };

  public shared func deletePlayer(playerId: Nat) : async () {
    players := Array.filter<Player>(players, func(player) {
      player.id != playerId;
    });
  };

  public shared func editPlayer(id: Nat, firstName: Text, lastName: Text, team: Text) : async () {
    players := Array.map<Player, Player>(players, func(player) {
      if (player.id == id) {
        { id; firstName; lastName; team };
      } else {
        player;
      }
    });
  };
}
