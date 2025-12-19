import streamlit as st

# Setup page
st.set_page_config(page_title="William Theodor Lehn-Schiøler", page_icon="🧠")

# Title and Subtitle
st.title("William Theodor Lehn-Schiøler")
st.subheader("Industrial PhD Student at BrainCapture and DTU Health Tech")

# Layout with columns to handle the image and text side-by-side
col1, col2 = st.columns([1, 2])

with col1:
    # Standard Python command for images
    st.image("William.jpeg", use_container_width=True)

with col2:
    st.write("""
    Welcome! I am a passionate individual working on AI for EEG. 
    This space serves as a central hub for my professional online presence.
    """)
    
    # Standard Python commands for buttons
    st.link_button("View My LinkedIn", "https://www.linkedin.com/in/williamtheodor/")
    st.link_button("My Google Scholar", "https://scholar.google.com/citations?user=7K_-v1UAAAAJ&hl=en&oi=ao")

st.divider()
st.caption("Built with Python and Streamlit.")