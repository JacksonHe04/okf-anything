import { zh } from './zh';

export const en: typeof zh = {
  // Navigation
  aboutUs: 'ABOUT US',
  technology: 'TECHNOLOGY',
  service: 'SERVICE',
  blog: 'BLOG',
  contacts: 'CONTACTS',
  products: 'PRODUCTS',

  // Hero Section
  sloganLine1: 'nothing',
  sloganLine2: 'is impossible',
  heroTitle: 'MOONLESS OKF SYSTEM',
  heroIntro: "They told us to aim for the Moon. We did. We put everything up there—our notes, our thoughts, our years of work—on someone else's servers, in someone else's client, behind someone else's paywall. Now the servers are slow. The seats cost more. And we're still up there, floating, wondering how to come home.",

  // Weather and Meta
  weatherStatus: 'LOCAL STORAGE CLEAR, Fast read-write. Max space unlimited.',
  editionInfo: 'VOL. I ... NO. 01',
  latestEventBadge: 'Latest event',
  epaper: 'E-PAPER',
  todaysPaper: "TODAY'S PAPER",
  explore: 'EXPLORE',

  // ESCAPE Article
  escapeTitle: 'ESCAPE: BREAK FREE FROM CLOUD NOTION / LARK / YUQUE',
  escapeText: 'moon-escape streams your workspace from the cloud to your local storage into Google OKF-compliant Markdown. With adaptive concurrency limiters and exponential backoff retry mechanisms, it pulls your documents, databases, and blocks safely and quickly. Notion is fully implemented, handling 2025 multi-data sources, inline page reorganizations, and budgeted paths, ensuring directory relationships are 100% preserved.',

  // Join Us Article
  joinUsTitle: 'JOIN US OR BUILD LOCAL KNOWLEDGE',
  joinUsText: 'Join us and build your local private knowledge system, free from cloud bindings, and enjoy a pure, unobstructed, and ultra-fast personal knowledge management experience. Three modules share the same OKF contract—change in one place, take effect globally. Run fully local without monthly seat fee.',

  // Mini Articles
  escapeReleasedHeader: 'ESCAPE MODULE #01 RELEASED',
  escapeReleasedTitle: 'Notion Export Strategy Reaches Full Idempotency',
  escapeReleasedText: 'The new pull mechanism supports resume-from-break and strong idempotency check. It compares the notion_id in local Markdown frontmatter and skips already completed subtrees, avoiding Notion rate limits and scaling speed.',
  learnMore: 'LEARN MORE →',

  editorNeedsHeader: 'MOON EDITOR NEEDS YOUR FILES',
  editorNeedsTitle: 'Tiptap WYSIWYG Web App Integrates Native File System API',
  editorNeedsText: 'MOON editor runs inside the browser sandbox, using File System Access API for local directory sync without server-side storage. Changes write directly to disk, resolving filename conflicts and increments dynamically.',

  // Secondary Newspaper
  home: 'Home',
  latest: 'Latest',
  world: 'World',
  editors: 'Editors',
  sports: 'Sports',
  lifestyle: 'Lifestyle',
  architectureHeader: 'ARCHITECTURE',
  architectureText: 'MOONLESS is built on top of a pnpm workspaces monorepo. It operates fully isolated inside a client-side Web App using local computation. Credentials and personal notes are never uploaded. Uses Google OKF as the main data contract.',
  thisWeekHeader: '★ THIS WEEK',
  dataFlowTitle: 'DATA FLOW PIPELINE',
  dataFlow1: '1. ESCAPE: Streams cloud workspaces and serializes them into OKF Markdown.',
  dataFlow2: '2. MOON: Local WYSIWYG Editor reading/writing local Markdown files with auto-saved structure.',
  dataFlow3: '3. SHOT: Smart RAG connecting engine computing embeddings and exposing Agent JSON APIs.',
  emagazineHeader: 'E-MAGAZINE COVER SHOWCASE',
  seeMore: 'See More →',

  // SHOT Article
  shotRoadmap: 'SHOT ROADMAP',
  shotTitle: 'TRENDING! LOCAL RAG KNOWLEDGE ENGINE',
  shotText: 'Local knowledge shouldn\'t just be static files. SHOT (Knowledge Engine) builds an Agent data pipeline: supports semantic vector retrieval of local Markdown chunks alongside MiniSearch keywords; scans relative paths to build memory Spaces Maps and Graph topologies; and exposes standard JSON API endpoints for external AI Agents to retrieve context.',

  // Editor Page (Workspace/Home)
  noFileSelected: 'No file selected',
  reloadWorkspace: 'Reload Workspace',
  aboutMoon: 'About MOON',
  aboutMoonless: 'About MOONLESS',
  saving: 'Saving...',
  saved: 'Saved',
  error: 'Error',
  unsaved: 'Unsaved',
  newFile: 'New File',
  newFolder: 'New Folder',
  newFileRoot: 'New File (At Root)',
  newFolderRoot: 'New Folder (At Root)',
  workspace: 'Workspace',
  searchTooltip: 'Search (⌘K)',
  searchPlaceholder: 'Type keywords to search entire workspace...',
  searchProgress: 'Indexing',
  moreActions: 'More',
  recentFiles: 'Recently Opened Files',
  loadWorkspaceTitle: 'Load your knowledge locally',
  selectWorkspaceBtn: 'Select Local Folder',
  reauthRequired: 'Re-authorization required',
  noDirectoryDetected: 'No valid workspace directory selected. Click the button to choose a local folder to start.',
  confirmDelete: 'Delete this document?',
  confirmDeleteText: 'This document and all its sub-documents will be deleted. This action is irreversible.',
  confirm: 'Confirm',
  cancel: 'Cancel',
  enterFileName: 'Please enter file name',
  enterFolderName: 'Please enter folder name',
  fileAlreadyExists: 'A file with this name already exists',
  folderAlreadyExists: 'A folder with this name already exists',
  noMatchesFound: 'No matching documents found',
  searchResults: 'Search Results',
  emptyWorkspaceMsg: 'Workspace directory is empty. Use bottom buttons to create a new file.',

  // Properties panel
  propertiesTitle: 'Document Properties',
  propTitle: 'Title',
  propType: 'Type',
  propDescription: 'Description',
  propTags: 'Tags',
  propResource: 'Original Resource',
  propCreatedTime: 'Created Time',
  propLastEditedTime: 'Last Edited Time',
  propNotionId: 'Notion ID',
  propParentType: 'Parent Type',
  propParentId: 'Parent ID',
  propUnknown: 'Unknown Property',

  // Toc & Related
  tableOfContents: 'Table of Contents',
  relatedDocs: 'Related Docs',
  backlinks: 'Backlinks',
  noHeadings: 'No headings found',
  noRelated: 'No related documents found',
  noBacklinks: 'No backlinks found',
  recentTitle: 'Recently Opened',

  // Welcome page keys
  welcomeSubtitleActive: 'Select a page from the document tree on the left to start editing, or use search on top to navigate quickly.',
  welcomeSubtitleEmpty: 'Select a local workspace first. MOONLESS will work directly on your Markdown files without any additional sync layer.',
  welcomeShortcuts: 'Keyboard Shortcuts',
  welcomeSearch: 'Global Search',
  welcomeSave: 'Save Now',
  welcomeLeftSidebar: 'Toggle Left Sidebar',
  welcomeRightSidebar: 'Toggle Right Sidebar',
  welcomeFollowLink: 'Follow Wiki Link (Cmd+Click)',
  welcomeInterface: 'Interface Layout',
  welcomeLeftSidebarDesc: 'Left Sidebar: Document tree and workspace switching.',
  welcomeTopBarDesc: 'Top Bar: Breadcrumbs, search, saving status, and theme switcher.',
  welcomeRightSidebarDesc: 'Right Sidebar: Properties, TOC, and related documents.',

  // WorkspaceSwitcher keys
  selectWorkspace: 'Select Workspace',
  clickToSwitchWorkspace: 'Click to switch workspace',
  unsupportedBrowserTitle: 'Browser does not support File System Access API',
  permissionDenied: 'Permission Denied',
  useSupportedBrowser: 'Please use Chrome / Edge / Arc',

  // Field / Property keys
  emptyValue: 'Empty',
  listPlaceholder: 'Comma separated, e.g. a, b, c',
  noFrontmatter: 'This file has no frontmatter',
  addFrontmatter: 'Add frontmatter',
  requiredField: 'Required',

  // Search Results keys
  noSearchResults: 'No matches found',
  typeToSearch: 'Type keywords to start searching',

  // ContextMenu & Dialogs
  nameAlreadyExists: 'This name already exists',
  enterName: 'Enter name',
  clickOutsideToCancel: 'Click outside or cancel button to cancel',
  delete: 'Delete',

  // TreeNode keys
  loading: 'Loading...',
  newFileHere: 'New File Here',
  newFolderHere: 'New Folder Here',
  rename: 'Rename',
  newSubDoc: 'New Sub-document',
  renameTitle: 'Rename "{name}"',
  deleteTitle: 'Delete "{name}"?',
  confirmDeleteTextSingle: 'This action is irreversible.',
  newFileIn: 'New File in {name}/',
  newFolderIn: 'New Folder in {name}/',
  newSubDocIn: 'New Sub-document under {name}',

  // RightRail keys
  propertiesTab: 'Properties',
  tocTab: 'TOC',
  relatedTab: 'Related',
};
export default en;
