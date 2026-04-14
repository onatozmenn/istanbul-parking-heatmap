import { useState, useEffect } from "react";
import type { BlockDetail } from "../types";

/**
 * Block detail hook - uses the already-loaded block data instead of SODA API.
 * In the Ankara version, all data comes from pre-generated local JSON files.
 */
export function useBlockDetail(
  blockId: string | null,
  meters: number,
  street: string,
) {
  const [detail, setDetail] = useState<BlockDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blockId) {
      setDetail(null);
      return;
    }

    // Data is already available from the main parking data file
    // No need for on-demand API queries in the Ankara version
    setLoading(false);
    setError(null);
    setDetail(null); // Will use parent block.slots as fallback
  }, [blockId, meters, street]);

  return { detail, loading, error };
}
