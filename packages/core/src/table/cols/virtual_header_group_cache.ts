import { shallowEqual } from "../../utils";
import { VirtualHeaderGroup } from "./header_group";
import { VirtualHeader } from "./virtual_header/types";

export class VirtualHeaderGroupCache {
  // Cache for header groups keyed by group.id
  private groupCache = new Map<string, VirtualHeaderGroup>();
  // Cache for overall result array (if nothing changed, we can return the same reference)
  private lastResult: VirtualHeaderGroup[] | null = null;

  /**
   * Updates the cache with the new header groups.
   * If nothing changes, returns the same array reference.
   * For each header group, only headers that have actually updated are new objects.
   */
  public update(newGroups: VirtualHeaderGroup[]): VirtualHeaderGroup[] {
    let changed = false;

    const updatedGroups = newGroups.map((newGroup) => {
      const cachedGroup = this.groupCache.get(newGroup.id);
      // If no cached group, cache the new one immediately.
      if (!cachedGroup) {
        this.groupCache.set(newGroup.id, newGroup);
        changed = true;
        return newGroup;
      }

      // Check if any of the group's scalar properties have changed.
      let groupChanged =
        cachedGroup.offsetLeft !== newGroup.offsetLeft ||
        cachedGroup.offsetRight !== newGroup.offsetRight ||
        cachedGroup.headerGroup !== newGroup.headerGroup ||
        cachedGroup.headers.length !== newGroup.headers.length;

      // Build a lookup of the cached headers keyed by headerId.
      const cachedHeaderMap = new Map<string, VirtualHeader>();
      cachedGroup.headers.forEach((h) => cachedHeaderMap.set(h.headerId, h));

      // Process headers: if a header exists and its properties are the same, reuse it.
      let headersChanged = false;
      const newHeadersMapped = newGroup.headers.map((newHeader) => {
        const cachedHeader = cachedHeaderMap.get(newHeader.headerId);

        if (
          cachedHeader &&
          shallowEqual(cachedHeader, newHeader, ["dndStyle"]) &&
          shallowEqual(cachedHeader.dndStyle, newHeader.dndStyle)
        ) {
          return cachedHeader;
        }

        // Otherwise, mark that headers have changed and use the new header.
        headersChanged = true;
        return newHeader;
      });

      // Check ordering: if the new header array isn't in the same order as before, treat as changed.
      let sameOrder = true;
      if (cachedGroup.headers.length === newHeadersMapped.length) {
        for (let i = 0; i < cachedGroup.headers.length; i++) {
          if (
            cachedGroup.headers[i].headerId !== newHeadersMapped[i].headerId
          ) {
            sameOrder = false;
            break;
          }
        }
      } else {
        sameOrder = false;
      }

      // Final headers: if nothing changed (including order), reuse the cached headers array.
      let finalHeaders = cachedGroup.headers;
      if (headersChanged || !sameOrder) {
        groupChanged = true;
        finalHeaders = newHeadersMapped;
      }

      if (groupChanged) {
        // Create a new group object that uses the possibly updated headers.
        const updatedGroup: VirtualHeaderGroup = {
          ...newGroup,
          headers: finalHeaders,
        };
        this.groupCache.set(newGroup.id, updatedGroup);
        changed = true;
        return updatedGroup;
      }
      // No change for this group: return the cached object.
      return cachedGroup;
    });

    if (!changed && this.lastResult) {
      if (updatedGroups.length !== this.lastResult.length) {
        changed = true;
      } else {
        for (let i = 0; i < updatedGroups.length; i++) {
          if (updatedGroups[i].id !== this.lastResult[i].id) {
            changed = true;
            break;
          }
        }
      }
    }
    // If nothing changed overall, return the same array reference.
    if (!changed && this.lastResult) {
      return this.lastResult;
    }
    this.lastResult = updatedGroups;
    return updatedGroups;
  }
}
