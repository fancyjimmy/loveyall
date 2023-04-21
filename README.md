How should Lobby be implemented?

- [x] with customizeable Policies responsible for the Lobby's behavior
- [ ] combined into the Handler
- [ ] Lobby Logic seperate to Handler

Why should it be combined into the Handler?

- The functions it uses do also have to be available in the Handler
- There is no need to have a variable for the Lobby in the Handler
- Easier time to emit Events from the lobby, so Lifecycle Events don't have to intertwine

Why should it be seperate from the Handler?

- The Handler is already big enough
- Keeps the Socket Logic seperate from the Lobby Logic
- The Lobby Logic is easier to test

