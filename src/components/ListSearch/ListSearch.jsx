import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as listService from "../../services/listService.js";
import styles from "./ListSearch.module.css";

export default function ListSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const abortRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = searchTerm.trim();

    // reset state if query too short
    if (q.length < 2) {
      setResults([]);
      setErrMsg("");
      setLoading(false);
      abortRef.current?.abort?.();
      abortRef.current = null;
      return;
    }

    setLoading(true);
    setErrMsg("");

    // debounce
    const t = setTimeout(async () => {
      // cancel previous request
      abortRef.current?.abort?.();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const data = await listService.searchAllLists(q, {
          signal: controller.signal,
        });

        // expecting { lists: [...] }
        setResults(data?.lists ?? []);
      } catch (e) {
        if (controller.signal.aborted) return;
        setErrMsg(e.message || "List search failed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [searchTerm]);

  const handlePick = (list) => {
    setSearchTerm("");
    setResults([]);
    navigate(`/lists/${list._id}`);
  };

  return (
    <div className={styles.searchContainer}>
      <form onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="list-search" className={styles.searchLabel}>
          Search Lists:
        </label>

        <input
          id="list-search"
          type="text"
          autoComplete="off"
          placeholder="Search other users' lists"
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      {results.length > 0 && (
        <ul className={styles.dropdownList}>
          {results.map((l) => (
            <li
              key={l._id}
              className={styles.dropdownItem}
              onClick={() => handlePick(l)}
            >
              {l.name}
              {l.owner?.username ? ` — ${l.owner.username}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}