// DEBUG SCRIPT: Investigate stuck entry
// Run this in browser console to identify the exact issue

async function debugStuckEntry() {
  if (typeof window === 'undefined' || !window.db) {
    console.log('❌ DEBUG: Not in browser environment');
    return;
  }

  try {
    console.log('🔍 DEBUG: Starting investigation...');
    
    // 1. Find the stuck entry (synced: 0)
    const unsyncedEntries = await window.db.entries.where('synced').equals(0).toArray();
    console.log(`📊 DEBUG: Found ${unsyncedEntries.length} unsynced entries`);
    
    if (unsyncedEntries.length > 0) {
      const stuckEntry = unsyncedEntries[0]; // Get the first stuck entry
      console.log('🎯 DEBUG: Stuck entry details:', {
        localId: stuckEntry.localId,
        bookId: stuckEntry.bookId,
        synced: stuckEntry.synced,
        cid: stuckEntry.cid,
        type: stuckEntry.type,
        amount: stuckEntry.amount,
        _id: stuckEntry._id
      });
      
      // 2. Look up the parent book
      const parentBook = await window.db.books.get({ _id: stuckEntry.bookId });
      console.log('📚 DEBUG: Parent book details:', {
        bookId: stuckEntry.bookId,
        foundParent: !!parentBook,
        parentLocalId: parentBook?.localId,
        parentId: parentBook?._id,
        parentSynced: parentBook?.synced,
        parentCid: parentBook?.cid
      });
      
      // 3. Check the sync lock condition manually
      const isBookSettled = parentBook && (
        (parentBook.synced === 1) || 
        (parentBook._id && typeof parentBook._id === 'string' && parentBook._id.startsWith('507f'))
      );
      
      console.log('🔒 DEBUG: Sync lock analysis:', {
        isBookSettled,
        parentBookSynced: parentBook?.synced,
        parentId: parentBook?._id,
        parentIdType: typeof parentBook?._id,
        parentIdStartsWith: parentBook?._id?.startsWith('507f'),
        condition1: parentBook?.synced === 1,
        condition2: parentBook._id && typeof parentBook._id === 'string' && parentBook._id.startsWith('507f')
      });
      
      // 4. Check if entry.bookId matches parent book
      const entryMatchesParent = (
        stuckEntry.bookId === parentBook?._id || 
        stuckEntry.bookId === String(parentBook?.localId)
      );
      
      console.log('🔗 DEBUG: Entry-Book relationship:', {
        entryBookId: stuckEntry.bookId,
        parentBookId: parentBook?._id,
        parentLocalId: parentBook?.localId,
        entryMatchesParent
      });
      
      // 5. Check all books for similar patterns
      const allBooks = await window.db.books.toArray();
      const similarBooks = allBooks.filter(book => 
        book._id && book._id.includes('507f')
      );
      
      console.log('📚 DEBUG: All books with server _id:', similarBooks.map(book => ({
        localId: book.localId,
        _id: book._id,
        synced: book.synced,
        cid: book.cid
      })));
      
    } else {
      console.log('✅ DEBUG: No stuck entries found');
    }
    
  } catch (error) {
    console.error('❌ DEBUG: Investigation failed:', error);
  }
}

// Auto-run the investigation
debugStuckEntry();
