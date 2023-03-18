import { useRef, useState } from "react";
import styled, { css } from "styled-components";

const SQUARE_WIDTH = 500; /** ドラッグ可能なXの範囲(px) 実際は写真の幅になります */
const SQUARE_HEIGHT = 500; /** ドラッグ可能なYの範囲(px) 実際は写真の高さになります */
const MIN_X = 0; /** X方向の最小座標 */
const MAX_X = 1; /** X方向の最大座標 */
const MIN_Y = 0; /** Y方向の最小座標 */
const MAX_Y = 1; /** Y方向の最大座標 */
const LINE_LENGTH = 0.1; /** これはスタイルで当てているだけなので気にしないでください */

type DraddingPoint = "start" | "end" | null;

export const Graph: React.FC = () => {
  const [startPoint, setStartPoint] = useState({ x: 0.3, y: 0.5 });
  const [endPoint, setEndPoint] = useState({ x: 0.7, y: 0.5 });
  const [directionPoint, setDirectionPoint] = useState({ x: 0.5, y: 0.4 });
  const [draggingTarget, setDraggingTarget] = useState<DraddingPoint>(null);
  const [isReverse, setIsReverse] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /**
   * ドラッグ中の座標を再計算する
   */
  const calculateLinePosition = (event: any): { x: number; y: number } => {
    const rect = ref.current!.getBoundingClientRect();
    /** 最大・最小座標を超えないよう、調整 */
    const x = Math.min(
      Math.max((event.clientX - rect.left) / rect.height, MIN_X),
      MAX_X
    );
    /** 最大・最小座標を超えないよう、調整 */
    const y = Math.min(
      Math.max((event.clientY - rect.top) / rect.height, MIN_Y),
      MAX_Y
    );

    return { x, y };
  };

  /**
   * direction方向を計算する関数
   */
  const calculateDirectionLinePoint = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    isReverse: boolean
  ): { x: number; y: number } => {
    const xDiff = x1 - x2;
    const yDiff = y1 - y2;
    const sx = (x1 + x2) / 2;
    const sy = (y1 + y2) / 2;

    if (yDiff === 0 && x1 < x2) {
      return { x: sx, y: Math.max(sy - LINE_LENGTH, 0) };
    }
    if (yDiff === 0 && x1 > x2) {
      return { x: sx, y: Math.min(sy + LINE_LENGTH, 1) };
    }

    if (isNaN(yDiff / xDiff) || !isFinite(yDiff / xDiff)) {
      return { x: 0, y: 0 };
    }

    const angle = Math.atan2(yDiff, xDiff);
    const perpendicularAngle = isReverse
      ? angle - Math.PI / 2
      : angle + Math.PI / 2;
    const distance = Math.sqrt(xDiff ** 2 + yDiff ** 2);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const x = midX + (distance / 2) * Math.cos(perpendicularAngle);
    const y = midY + (distance / 2) * Math.sin(perpendicularAngle);

    return { x, y };
  };

  /**
   * ドラッグ開始時に呼ばれる関数
   * どのtarget(start/end)をドラックしているかをチェックし、stateをsetする
   */
  const handleMouseDown = (target: "start" | "end"): void => {
    setDraggingTarget(target);
  };

  /**
   * directionの方向を変えるボタンをクリックした時に呼ばれる関数
   * directionを再計算する
   */
  const onClickReverse = (): void => {
    setIsReverse((prev) => !prev);
    const { x, y } = calculateDirectionLinePoint(
      startPoint.x,
      startPoint.y,
      endPoint.x,
      endPoint.y,
      !isReverse
    );
    setDirectionPoint({ x, y });
  };

  /**
   * ドラッグ中に呼ばれる関数
   * 1. start or end pointの座標を計算
   * 2. direction pointを計算
   */
  const handleMouseMove = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    isReverse: boolean,
    draddingPoint: DraddingPoint
  ): void => {
    if (!draddingPoint) return;

    const { x, y } = calculateLinePosition(event);
    draddingPoint === "start" ? setStartPoint({ x, y }) : setEndPoint({ x, y });

    const { x: directionX, y: directionY } = calculateDirectionLinePoint(
      startPoint.x,
      startPoint.y,
      endPoint.x,
      endPoint.y,
      isReverse
    );
    setDirectionPoint({ x: directionX, y: directionY });
  };

  return (
    <>
      <Board
        ref={ref}
        onMouseMove={(e) => handleMouseMove(e, isReverse, draggingTarget)}
        onMouseUp={() => setDraggingTarget(null)}
      >
        <StartPoint
          startPoint={startPoint}
          dragging={!!draggingTarget}
          onMouseDown={() => handleMouseDown("start")}
        />
        <EndPoint
          endPoint={endPoint}
          dragging={!!draggingTarget}
          onMouseDown={() => handleMouseDown("end")}
        />
        <Svg>
          <line
            x1={startPoint.x * SQUARE_WIDTH}
            y1={startPoint.y * SQUARE_HEIGHT}
            x2={endPoint.x * SQUARE_WIDTH}
            y2={endPoint.y * SQUARE_HEIGHT}
            stroke={"#3376ff"}
            strokeWidth={2}
          />
          <line
            x1={((startPoint.x + endPoint.x) / 2) * SQUARE_WIDTH}
            y1={((startPoint.y + endPoint.y) / 2) * SQUARE_HEIGHT}
            x2={directionPoint.x * SQUARE_WIDTH}
            y2={directionPoint.y * SQUARE_HEIGHT}
            stroke={"#2222ff"}
            strokeWidth={2}
          />
        </Svg>
      </Board>
      <button onClick={onClickReverse}>reverse</button>
    </>
  );
};

const Board = styled.div`
  position: relative;
  width: ${SQUARE_WIDTH}px;
  height: ${SQUARE_HEIGHT}px;
  border: 1px solid black;
`;

const pointStyle = css`
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #3376ff;
`;

const StartPoint = styled.div<{
  startPoint: { x: number; y: number };
  dragging: boolean;
}>`
  ${pointStyle}
  left: ${({ startPoint }) => startPoint.x * 100 - 0.5}%;
  top: ${({ startPoint }) => startPoint.y * 100 - 0.5}%;
  cursor: ${({ dragging }) => (dragging ? "grabbing" : "grab")};
`;

const EndPoint = styled.div<{
  endPoint: { x: number; y: number };
  dragging: boolean;
}>`
  ${pointStyle}
  left: ${({ endPoint }) => endPoint.x * 100 - 0.5}%;
  top: ${({ endPoint }) => endPoint.y * 100 - 0.5}%;
  cursor: ${({ dragging }) => (dragging ? "grabbing" : "grab")};
`;

const Svg = styled.svg`
  position: "relative";
  width: ${SQUARE_WIDTH}px;
  height: ${SQUARE_HEIGHT}px;
  z-index: -1;
  pointer-events: none;
`;
