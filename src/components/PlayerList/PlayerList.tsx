import { Droppable, Draggable } from 'react-beautiful-dnd';
import useStore from '../../store';
import Player from '../Player/Player';
import styles from './PlayerList.module.css';
import React from 'react';

interface PlayerListProps {
  droppableId: 'field-players' | 'bench-players';
  title: string;
  recommendedSubId?: string | null;
}

const PlayerList = ({ droppableId, title, recommendedSubId }: PlayerListProps) => {
  const players = useStore(state => droppableId === 'field-players' ? state.onField : state.onBench);
  const handleGoal = useStore(state => state.handleGoal);
  const togglePlayerPosition = useStore(state => state.togglePlayerPosition);

  return (
    <div className={styles.listContainer}>
      <h2>{title}</h2>
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={styles.dropzone}
          >
            {players.map((player, index) => (
              <Draggable key={player.id} draggableId={player.id} index={index} isDragDisabled={player.isGoalie}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <Player
                      player={player}
                      onPlayerClick={togglePlayerPosition}
                      onScore={handleGoal}
                      isOnField={droppableId === 'field-players'}
                      isRecommended={player.id === recommendedSubId}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default React.memo(PlayerList); 