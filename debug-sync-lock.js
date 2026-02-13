// ENHANCED DEBUG: Check sync lock logic edge cases
// Run this to identify why isBookSettled might be failing

async function debugSyncLockLogic() {
  if (typeof window === 'undefined' || !window.db) {
    console.log('❌ DEBUG: Not in browser environment');
    return;
  }

  try {
    console.log('🔍 DEBUG: Analyzing sync lock logic...');
    
    // 1. Find all books and check patterns
    const allBooks = await window.db.books.toArray();
    console.log(`📚 DEBUG: Total books in DB: ${allBooks.length}`);
    
    const booksWithServerId = allBooks.filter(book => book._id && typeof book._id === 'string');
    console.log(`🌐 DEBUG: Books with server _id: ${booksWithServerId.length}`);
    
    booksWithServerId.forEach(book => {
      console.log('📖 DEBUG: Server book:', {
        localId: book.localId,
        _id: book._id,
        synced: book.synced,
        cid: book.cid,
        startsWith507f: book._id?.startsWith('507f'),
        isSettledBySync: book.synced === 1,
        isSettledByCondition: (book.synced === 1) || (book._id && typeof book._id === 'string' && book._id.startsWith('507f'))
      });
    });
    
    // 2. Find unsynced entries and their parent books
    const unsyncedEntries = await window.db.entries.where('synced').equals(0).toArray();
    console.log(`📝 DEBUG: Unsynced entries: ${unsyncedEntries.length}`);
    
    for (const entry of unsyncedEntries.slice(0, 3)) { // Check first 3
      const parentBook = await window.db.books.get({ _id: entry.bookId });
      
      console.log(`🔗 DEBUG: Entry ${entry.localId} -> Parent Book:`, {
        entryBookId: entry.bookId,
        entryType: entry.type,
        entryAmount: entry.amount,
        parentFound: !!parentBook,
        parentId: parentBook?._id,
        parentSynced: parentBook?.synced,
        parentIdType: typeof parentBook?._id,
        parentIdStartsWith507f: parentBook?._id?.startsWith('507f'),
        
        // Manual condition check
        condition1: parentBook?.synced === 1,
        condition2: parentBook?._id && typeof parentBook?._id === 'string' && parentBook?._id.startsWith('507f'),
        combinedCondition: (parentBook?.synced === 1) || (parentBook?._id && typeof parentBook?._id === 'string' && parentBook?._id.startsWith('507f')),
        
        wouldBeSettled: combinedCondition
      });
    }
    
  } catch (error) {
    console.error('❌ DEBUG: Analysis failed:', error);
  }
}

// Auto-run the analysis
debugSyncLockLogic();
