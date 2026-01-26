import { useParams } from 'react-router-dom';
import styles from './ShowList.module.css';

const ShowList = () => {
  const { listId } = useParams();

  return (
    <main className={styles.container}>
      <h2>List</h2>
      <p>listId: {listId}</p>
    </main>
  );
};

export default ShowList;
