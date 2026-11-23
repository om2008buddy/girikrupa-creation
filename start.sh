#!/bin/bash
# Gurukrupa Creation - Startup Script

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Ensure local node wrapper exists
mkdir -p ~/.local/bin
cat << 'EOF' > ~/.local/bin/node
#!/bin/bash
export ELECTRON_RUN_AS_NODE=1
exec "/Applications/Antigravity IDE.app/Contents/MacOS/Electron" "$@"
EOF
chmod +x ~/.local/bin/node

export PATH="$HOME/.local/bin:$PATH"

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

echo "=========================================================="
echo "    ગુરુકૃપા ક્રિએશન - મેન્યુફેક્ચરિંગ નફા હિસાબ એપ     "
echo "=========================================================="
echo "કમ્પ્યુટર બ્રાઉઝર:  http://localhost:4500"
echo "એન્ડ્રોઇડ મોબાઇલ:   http://${IP:-192.168.1.2}:4500"
echo "સુરક્ષા પાસવર્ડ:    6390"
echo "=========================================================="
echo "સર્વર શરૂ થઈ રહ્યું છે..."

# Open in browser after 1 second in background
(sleep 1 && open "http://localhost:4500") &

# Run server
~/.local/bin/node server.js
