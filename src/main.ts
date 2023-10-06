import {
  Color,
  InputEvent,
  MultiTextureBatch,
  Texture,
  ViewportInputHandler,
  createGameLoop,
  createStage,
  createViewport,
} from "gdxts";
import { io } from "socket.io-client";

const init = () => {
  const stage = createStage();
  const canvas = stage.getCanvas();

  const viewport = createViewport(canvas, 500, 1000);

  const gl = viewport.getContext();

  const camera = viewport.getCamera();
  camera.setYDown(true);

  const batch = new MultiTextureBatch(gl);
  batch.setYDown(true);

  const white = Texture.createWhiteTexture(gl);

  let roomId: string | undefined = undefined;

  const positions = [
    [0, 0],
    [0, 0],
  ];

  const socket = io("ws://localhost:3000/");

  socket.on("connected", () => {
    console.log(`Client ${socket.id} connected`);

    socket.emit("findMatch");
  });

  let index: number | undefined = undefined;

  socket.on("matchFound", (e) => {
    console.log(e);
    const { roomId: newRoomId } = e;
    roomId = newRoomId;
    index = e.index;
    console.log(index);
  });

  socket.on("stateUpdate", (e) => {
    const { positions: newPositions } = e;
    console.log(positions);
    positions[0] = newPositions[0];
    positions[1] = newPositions[1];
    console.log("update", positions);
  });

  const inputHandler = new ViewportInputHandler(viewport);
  inputHandler.addEventListener(InputEvent.TouchEnd, () => {
    if (!roomId) return;
    const { x, y } = inputHandler.getTouchedWorldCoord();
    const id = socket.id;
    socket.emit("move", {
      roomId,
      position: [x, y],
      id,
    });
    positions[index!] = [x, y];
  });

  gl.clearColor(0, 0, 0, 1);
  createGameLoop((delta) => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    batch.setProjection(camera.combined);
    batch.begin();
    batch.draw(white, 0, 0, 500, 1000);
    batch.setColor(Color.GREEN);
    batch.draw(white, positions[0][0], positions[0][1], 10, 10);
    batch.setColor(Color.RED);
    batch.draw(white, positions[1][0], positions[1][1], 10, 10);
    batch.setColor(Color.WHITE);
    batch.end();
  });
};

init();
